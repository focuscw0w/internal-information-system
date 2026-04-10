<?php

namespace Modules\CapacityManagement\Services;

use Modules\CapacityManagement\DTO\SimulationInput;
use Modules\CapacityManagement\DTO\SimulationSuggestion;

class SimulationSuggestionEngine
{
    private const MAX_SUGGESTIONS = 10;

    /**
     * Generate rule-based suggestions from baseline/simulated snapshots.
     *
     * @param  array           $baseline
     * @param  array           $simulated
     * @param  SimulationInput $input
     * @param  array<int,int>  $simulatedCapacitiesMap
     * @return SimulationSuggestion[]
     */
    public function generate(
        array $baseline,
        array $simulated,
        SimulationInput $input,
        array $simulatedCapacitiesMap,
    ): array {
        $suggestions = [];

        $suggestions = array_merge($suggestions, $this->ruleA_OverloadedUsers($baseline, $simulated, $simulatedCapacitiesMap));
        $suggestions = array_merge($suggestions, $this->ruleB_ProjectCannotFinish($baseline, $simulated, $simulatedCapacitiesMap));
        $suggestions = array_merge($suggestions, $this->ruleC_DeadlineInPast($simulated));
        $suggestions = array_merge($suggestions, $this->ruleD_OverEstimatedAllocation($simulated));
        $suggestions = array_merge($suggestions, $this->ruleE_PositiveSignal($baseline, $simulated));

        $suggestions = $this->dedup($suggestions);
        $suggestions = $this->sort($suggestions);

        return array_slice($suggestions, 0, self::MAX_SUGGESTIONS);
    }

    // ── Rule A: User overloaded in simulated state ────────────────────────────

    private function ruleA_OverloadedUsers(array $baseline, array $simulated, array $capacitiesMap): array
    {
        $suggestions = [];
        $baselineOverIds = collect($baseline['alerts'])->pluck('id')->flip();

        foreach ($simulated['alerts'] as $alert) {
            $userId      = $alert['id'];
            $utilization = $alert['weekly_utilization'];
            $weeklyCapacity = $capacitiesMap[$userId] ?? 40;
            $weeklyLoad  = ($utilization / 100) * $weeklyCapacity;
            $excessHours = (int) ceil($weeklyLoad - $weeklyCapacity);

            $wasAlreadyOverloaded = isset($baselineOverIds[$userId]);
            $severity = $wasAlreadyOverloaded ? 'warning' : 'critical';

            // Primary: reduce biggest allocation
            $suggestions[] = new SimulationSuggestion(
                id: "A_reduce_{$userId}",
                type: 'REDUCE_ALLOCATION',
                severity: $severity,
                title: "Skrátiť alokáciu pre {$alert['name']} o {$excessHours}h",
                rationale: "{$alert['name']} je pretažen* ({$utilization}%). Zníženie alokácie odstráni preťaženie.",
                proposedChange: [
                    'capacity_overrides' => [],
                    'allocation_overrides' => [],
                    'deadline_overrides' => [],
                    'team_changes' => [],
                    '_hint' => "reduce_allocation_user_{$userId}_by_{$excessHours}h",
                ],
                affectsUserId: $userId,
            );

            // Secondary: if free people exist, suggest reassignment
            $freePeople = collect($simulated['free_people']);
            if ($freePeople->isNotEmpty()) {
                $bestFree = $freePeople->first();

                $suggestions[] = new SimulationSuggestion(
                    id: "A_reassign_{$userId}_to_{$bestFree['id']}",
                    type: 'REASSIGN_TO_FREE_USER',
                    severity: 'warning',
                    title: "Presunúť {$excessHours}h z {$alert['name']} na {$bestFree['name']}",
                    rationale: "{$bestFree['name']} má voľných {$bestFree['free_capacity_hours']}h/týždeň "
                        ."a môže prevziať prácu od pretaženého {$alert['name']}.",
                    proposedChange: [
                        'capacity_overrides' => [],
                        'allocation_overrides' => [],
                        'deadline_overrides' => [],
                        'team_changes' => [],
                        '_hint' => "reassign_{$excessHours}h_from_{$userId}_to_{$bestFree['id']}",
                    ],
                    affectsUserId: $userId,
                );
            }
        }

        return $suggestions;
    }

    // ── Rule B: Project cannot finish ────────────────────────────────────────

    private function ruleB_ProjectCannotFinish(array $baseline, array $simulated, array $capacitiesMap): array
    {
        $suggestions = [];
        $teamWeeklyCapacity = max(1, array_sum($capacitiesMap));
        $baselineCanFinishIds = collect($baseline['prediction']['projects'] ?? [])
            ->where('can_finish', true)
            ->pluck('id')
            ->flip();

        foreach ($simulated['prediction']['projects'] ?? [] as $project) {
            if ($project['can_finish'] || $project['is_overdue']) {
                continue;
            }

            $hoursShort = max(0, $project['remaining_hours'] - $project['available_hours_next_4_weeks']);
            $daysShort  = (int) ceil($hoursShort / max(1, $teamWeeklyCapacity / 7));
            $daysShort  = max(1, min(90, $daysShort));

            $wasAlreadyAtRisk = ! isset($baselineCanFinishIds[$project['id']]);
            $severity = $wasAlreadyAtRisk ? 'warning' : 'critical';

            // Primary: extend deadline
            $suggestions[] = new SimulationSuggestion(
                id: "B_extend_{$project['id']}",
                type: 'EXTEND_DEADLINE',
                severity: $severity,
                title: "Posunúť termín projektu \"{$project['name']}\" o {$daysShort} dní",
                rationale: "Projekt potrebuje ešte ".round($project['remaining_hours'])."h; "
                    ."posun termínu o {$daysShort} dní poskytne dostatočnú kapacitu.",
                proposedChange: [
                    'capacity_overrides' => [],
                    'allocation_overrides' => [],
                    'deadline_overrides' => [
                        [
                            'project_id' => $project['id'],
                            'new_end_date' => now()->addDays($project['days_remaining'] + $daysShort)->toDateString(),
                        ],
                    ],
                    'team_changes' => [],
                ],
                affectsProjectId: $project['id'],
            );

            // Secondary: add a free team member if available
            $freePeople = collect($simulated['free_people'])->take(2);
            foreach ($freePeople as $freePerson) {
                $suggestions[] = new SimulationSuggestion(
                    id: "B_add_member_{$project['id']}_{$freePerson['id']}",
                    type: 'ADD_TEAM_MEMBER',
                    severity: 'warning',
                    title: "Priradiť {$freePerson['name']} k projektu \"{$project['name']}\"",
                    rationale: "{$freePerson['name']} má voľných {$freePerson['free_capacity_hours']}h/týždeň "
                        ."a mohol/a by pomôcť s dokončením projektu.",
                    proposedChange: [
                        'capacity_overrides' => [],
                        'allocation_overrides' => [],
                        'deadline_overrides' => [],
                        'team_changes' => [
                            [
                                'project_id' => $project['id'],
                                'user_id' => $freePerson['id'],
                                'action' => 'add',
                            ],
                        ],
                    ],
                    affectsUserId: $freePerson['id'],
                    affectsProjectId: $project['id'],
                );
            }
        }

        return $suggestions;
    }

    // ── Rule C: Simulated deadline in the past ────────────────────────────────

    private function ruleC_DeadlineInPast(array $simulated): array
    {
        $suggestions = [];

        foreach ($simulated['prediction']['projects'] ?? [] as $project) {
            if ($project['is_overdue'] && $project['days_remaining'] === 0) {
                $suggestions[] = new SimulationSuggestion(
                    id: "C_overdue_{$project['id']}",
                    type: 'DEADLINE_IN_PAST',
                    severity: 'critical',
                    title: "Termín projektu \"{$project['name']}\" je v minulosti",
                    rationale: 'Navrhovaný termín projektu je pred dnešným dátumom. Skontrolujte zadaný dátum.',
                    proposedChange: [],
                    affectsProjectId: $project['id'],
                );
            }
        }

        return $suggestions;
    }

    // ── Rule D: Allocation exceeds remaining task hours ───────────────────────

    private function ruleD_OverEstimatedAllocation(array $simulated): array
    {
        $suggestions = [];

        foreach ($simulated['prediction']['projects'] ?? [] as $project) {
            $remaining = $project['remaining_hours'] ?? 0;

            if ($remaining <= 0) {
                continue;
            }

            // If a project has far more allocated capacity than needed
            $available = $project['available_hours_next_4_weeks'] ?? 0;
            if ($available > 0 && $available > $remaining * 2 && $available > 80) {
                $surplus = round($available - $remaining);
                $suggestions[] = new SimulationSuggestion(
                    id: "D_over_alloc_{$project['id']}",
                    type: 'REDUCE_OVERESTIMATED_ALLOCATION',
                    severity: 'info',
                    title: "Kapacita pre \"{$project['name']}\" prevyšuje potrebu o {$surplus}h",
                    rationale: "Projekt má ešte {$remaining}h práce, ale je dostupných {$available}h na 4 týždne. "
                        ."Zvážte presun nadbytočnej kapacity na iné projekty.",
                    proposedChange: [],
                    affectsProjectId: $project['id'],
                );
            }
        }

        return $suggestions;
    }

    // ── Rule E: Positive signal (user freed from overload) ───────────────────

    private function ruleE_PositiveSignal(array $baseline, array $simulated): array
    {
        $suggestions = [];
        $baselineOverIds = collect($baseline['alerts'])->pluck('id')->flip();

        foreach ($simulated['people'] as $person) {
            $userId = $person['id'];

            if (isset($baselineOverIds[$userId]) && $person['weekly_utilization'] < 80) {
                $suggestions[] = new SimulationSuggestion(
                    id: "E_freed_{$userId}",
                    type: 'CAPACITY_FREED',
                    severity: 'info',
                    title: "{$person['name']} má teraz voľnú kapacitu ({$person['free_capacity_hours']}h/týždeň)",
                    rationale: "{$person['name']} prešiel/prešla z preťaženia na {$person['weekly_utilization']}% využitia. "
                        ."Je vhodným kandidátom na nové úlohy.",
                    proposedChange: [],
                    affectsUserId: $userId,
                );
            }
        }

        return $suggestions;
    }

    // ── Dedup, sort, cap ──────────────────────────────────────────────────────

    /** Remove duplicate suggestions by (type, user_id, project_id) */
    private function dedup(array $suggestions): array
    {
        $seen = [];
        $result = [];

        foreach ($suggestions as $s) {
            $key = $s->type.'_'.($s->affectsUserId ?? '').'_'.($s->affectsProjectId ?? '');
            if (! isset($seen[$key])) {
                $seen[$key] = true;
                $result[] = $s;
            }
        }

        return $result;
    }

    private function sort(array $suggestions): array
    {
        $order = ['critical' => 0, 'warning' => 1, 'info' => 2];

        usort($suggestions, fn (SimulationSuggestion $a, SimulationSuggestion $b) => (
            ($order[$a->severity] ?? 3) <=> ($order[$b->severity] ?? 3)
        ));

        return $suggestions;
    }
}
