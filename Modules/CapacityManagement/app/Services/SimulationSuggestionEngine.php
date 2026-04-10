<?php

namespace Modules\CapacityManagement\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;
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
     * @param  Collection<int,object> $simulatedAllocations
     * @return SimulationSuggestion[]
     */
    public function generate(
        array $baseline,
        array $simulated,
        SimulationInput $input,
        array $simulatedCapacitiesMap,
        Collection $simulatedAllocations,
        Carbon $now,
    ): array {
        $suggestions = [];

        $suggestions = array_merge($suggestions, $this->ruleA_OverloadedUsers($baseline, $simulated, $simulatedCapacitiesMap, $simulatedAllocations));
        $suggestions = array_merge($suggestions, $this->ruleB_ProjectCannotFinish($baseline, $simulated, $simulatedCapacitiesMap, $simulatedAllocations, $now));
        $suggestions = array_merge($suggestions, $this->ruleC_DeadlineInPast($simulated));
        $suggestions = array_merge($suggestions, $this->ruleD_OverEstimatedAllocation($simulated, $simulatedAllocations));
        $suggestions = array_merge($suggestions, $this->ruleE_PositiveSignal($baseline, $simulated));

        $suggestions = $this->dedup($suggestions);
        $suggestions = $this->sort($suggestions);

        return array_slice($suggestions, 0, self::MAX_SUGGESTIONS);
    }

    // ── Rule A: User overloaded in simulated state ────────────────────────────

    private function ruleA_OverloadedUsers(
        array $baseline,
        array $simulated,
        array $capacitiesMap,
        Collection $simulatedAllocations,
    ): array
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
            $largestAllocation = $simulatedAllocations
                ->filter(fn ($allocation) => (int) $allocation->user_id === $userId)
                ->sortByDesc(fn ($allocation) => (float) ($allocation->allocated_hours ?? 0))
                ->first();

            if ($largestAllocation !== null) {
                $hoursReduction = $this->hoursReductionForWeeklyExcess($largestAllocation, $excessHours);
                $newHours = max(0, (int) ($largestAllocation->allocated_hours ?? 0) - $hoursReduction);

                $suggestions[] = new SimulationSuggestion(
                    id: "A_reduce_{$userId}",
                    type: 'REDUCE_ALLOCATION',
                    severity: $severity,
                    title: "Skrátiť alokáciu pre {$alert['name']} o {$excessHours}h/týždeň",
                    rationale: "{$alert['name']} je pretažen* ({$utilization}%). Zníženie najväčšej alokácie odstráni preťaženie.",
                    proposedChange: [
                        'capacity_overrides' => [],
                        'allocation_overrides' => [[
                            'project_id' => (int) $largestAllocation->project_id,
                            'user_id' => $userId,
                            'allocation_id' => $largestAllocation->id,
                            'allocated_hours' => $newHours,
                            'percentage' => $this->scaledPercentage($largestAllocation, $newHours),
                            'start_date' => $this->toDateString($largestAllocation->start_date),
                            'end_date' => $this->toDateString($largestAllocation->end_date),
                        ]],
                        'deadline_overrides' => [],
                        'team_changes' => [],
                    ],
                    affectsUserId: $userId,
                    affectsProjectId: (int) $largestAllocation->project_id,
                );
            }

            // Secondary: if free people exist, suggest reassignment
            $freePeople = collect($simulated['free_people']);
            if ($freePeople->isNotEmpty() && $largestAllocation !== null) {
                $bestFree = $freePeople->first();
                $hoursChunk = min(
                    $this->hoursReductionForWeeklyExcess($largestAllocation, $excessHours),
                    max(1, (int) floor(($bestFree['free_capacity_hours'] ?? 0) * $this->weeksInAllocation($largestAllocation)))
                );

                if ($hoursChunk <= 0) {
                    continue;
                }

                $remainingHours = max(0, (int) ($largestAllocation->allocated_hours ?? 0) - $hoursChunk);

                $suggestions[] = new SimulationSuggestion(
                    id: "A_reassign_{$userId}_to_{$bestFree['id']}",
                    type: 'REASSIGN_TO_FREE_USER',
                    severity: 'warning',
                    title: "Presunúť časť práce z {$alert['name']} na {$bestFree['name']}",
                    rationale: "{$bestFree['name']} má voľných {$bestFree['free_capacity_hours']}h/týždeň "
                        ."a môže prevziať prácu od pretaženého {$alert['name']}.",
                    proposedChange: [
                        'capacity_overrides' => [],
                        'allocation_overrides' => [
                            [
                                'project_id' => (int) $largestAllocation->project_id,
                                'user_id' => $userId,
                                'allocation_id' => $largestAllocation->id,
                                'allocated_hours' => $remainingHours,
                                'percentage' => $this->scaledPercentage($largestAllocation, $remainingHours),
                                'start_date' => $this->toDateString($largestAllocation->start_date),
                                'end_date' => $this->toDateString($largestAllocation->end_date),
                            ],
                            [
                                'project_id' => (int) $largestAllocation->project_id,
                                'user_id' => (int) $bestFree['id'],
                                'allocated_hours' => $hoursChunk,
                                'percentage' => min(100, (int) round(($hoursChunk / max(1, $this->weeksInAllocation($largestAllocation))) / 40 * 100)),
                                'start_date' => $this->toDateString($largestAllocation->start_date),
                                'end_date' => $this->toDateString($largestAllocation->end_date),
                            ],
                        ],
                        'deadline_overrides' => [],
                        'team_changes' => [[
                            'project_id' => (int) $largestAllocation->project_id,
                            'user_id' => (int) $bestFree['id'],
                            'action' => 'add',
                        ]],
                    ],
                    affectsUserId: $userId,
                    affectsProjectId: (int) $largestAllocation->project_id,
                );
            }
        }

        return $suggestions;
    }

    // ── Rule B: Project cannot finish ────────────────────────────────────────

    private function ruleB_ProjectCannotFinish(
        array $baseline,
        array $simulated,
        array $capacitiesMap,
        Collection $simulatedAllocations,
        Carbon $now,
    ): array
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
                            'new_end_date' => $now->copy()->addDays($project['days_remaining'] + $daysShort)->toDateString(),
                        ],
                    ],
                    'team_changes' => [],
                ],
                affectsProjectId: $project['id'],
            );

            // Secondary: add a free team member if available
            $freePeople = collect($simulated['free_people'])->take(2);
            foreach ($freePeople as $freePerson) {
                $currentProjectHours = $simulatedAllocations
                    ->filter(fn ($allocation) => (int) $allocation->project_id === (int) $project['id'])
                    ->sum(fn ($allocation) => (float) ($allocation->allocated_hours ?? 0));
                $hoursShortTotal = max(1, (int) ceil(max(0, $project['remaining_hours'] - $currentProjectHours)));
                $allocationHours = max(1, min($hoursShortTotal, (int) round(($freePerson['free_capacity_hours'] ?? 0) * min(4, max(1, (int) ceil(max(1, $project['days_remaining']) / 7))))));

                $suggestions[] = new SimulationSuggestion(
                    id: "B_add_member_{$project['id']}_{$freePerson['id']}",
                    type: 'ADD_TEAM_MEMBER',
                    severity: 'warning',
                    title: "Priradiť {$freePerson['name']} k projektu \"{$project['name']}\"",
                    rationale: "{$freePerson['name']} má voľných {$freePerson['free_capacity_hours']}h/týždeň "
                        ."a mohol/a by pomôcť s dokončením projektu.",
                    proposedChange: [
                        'capacity_overrides' => [],
                        'allocation_overrides' => [[
                            'project_id' => $project['id'],
                            'user_id' => $freePerson['id'],
                            'allocated_hours' => $allocationHours,
                            'percentage' => min(100, (int) round(($freePerson['free_capacity_hours'] / 40) * 100)),
                            'start_date' => $now->toDateString(),
                            'end_date' => $now->copy()->addDays(max(7, $project['days_remaining']))->toDateString(),
                        ]],
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

    private function ruleD_OverEstimatedAllocation(array $simulated, Collection $simulatedAllocations): array
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
                $largestAllocation = $simulatedAllocations
                    ->filter(fn ($allocation) => (int) $allocation->project_id === (int) $project['id'])
                    ->sortByDesc(fn ($allocation) => (float) ($allocation->allocated_hours ?? 0))
                    ->first();

                $proposedChange = [];
                if ($largestAllocation !== null) {
                    $newHours = max(0, min((int) round($remaining), (int) ($largestAllocation->allocated_hours ?? 0)));
                    $proposedChange = [
                        'capacity_overrides' => [],
                        'allocation_overrides' => [[
                            'project_id' => (int) $largestAllocation->project_id,
                            'user_id' => (int) $largestAllocation->user_id,
                            'allocation_id' => $largestAllocation->id,
                            'allocated_hours' => $newHours,
                            'percentage' => $this->scaledPercentage($largestAllocation, $newHours),
                            'start_date' => $this->toDateString($largestAllocation->start_date),
                            'end_date' => $this->toDateString($largestAllocation->end_date),
                        ]],
                        'deadline_overrides' => [],
                        'team_changes' => [],
                    ];
                }

                $suggestions[] = new SimulationSuggestion(
                    id: "D_over_alloc_{$project['id']}",
                    type: 'REDUCE_OVERESTIMATED_ALLOCATION',
                    severity: 'info',
                    title: "Kapacita pre \"{$project['name']}\" prevyšuje potrebu o {$surplus}h",
                    rationale: "Projekt má ešte {$remaining}h práce, ale je dostupných {$available}h na 4 týždne. "
                        ."Zvážte presun nadbytočnej kapacity na iné projekty.",
                    proposedChange: $proposedChange,
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

    private function hoursReductionForWeeklyExcess(object $allocation, int $weeklyExcessHours): int
    {
        return max(1, (int) ceil($weeklyExcessHours * $this->weeksInAllocation($allocation)));
    }

    private function weeksInAllocation(object $allocation): float
    {
        $start = $allocation->start_date instanceof Carbon ? $allocation->start_date->copy() : Carbon::parse($allocation->start_date);
        $end = $allocation->end_date instanceof Carbon ? $allocation->end_date->copy() : Carbon::parse($allocation->end_date);

        return max(1, ceil($start->diffInDays($end->copy()->addDay()) / 7));
    }

    private function scaledPercentage(object $allocation, int $newAllocatedHours): int
    {
        $originalHours = (int) ($allocation->allocated_hours ?? 0);
        $originalPercentage = (int) ($allocation->percentage ?? 0);

        if ($originalHours <= 0 || $originalPercentage <= 0) {
            return $originalPercentage;
        }

        return max(0, min(100, (int) round(($newAllocatedHours / $originalHours) * $originalPercentage)));
    }

    private function toDateString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value->toDateString();
        }

        return Carbon::parse($value)->toDateString();
    }
}
