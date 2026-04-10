<?php

namespace Modules\CapacityManagement\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\CapacityManagement\Contracts\SimulationServiceInterface;
use Modules\CapacityManagement\DTO\CapacityInputs;
use Modules\CapacityManagement\DTO\SimulationInput;
use Modules\CapacityManagement\DTO\SimulationResult;
use Modules\CapacityManagement\Enums\SimulationTeamAction;
use Modules\Project\Models\ProjectAllocation;

class SimulationService implements SimulationServiceInterface
{
    public function __construct(
        private readonly CapacityManagementService $capacityService,
        private readonly CapacityCalculator $calculator,
        private readonly SimulationSuggestionEngine $suggestionEngine,
    ) {}

    /**
     * Run a simulation with the given overrides. Nothing is persisted.
     */
    public function simulate(SimulationInput $input): SimulationResult
    {
        $now = Carbon::now();

        // 1. Fetch baseline data from DB
        $baselineInputs = $this->capacityService->buildInputs($now);

        // Load all ProjectAllocations (used for load derivation in simulation)
        $currentAllocations = ProjectAllocation::query()->get();

        $baseline = $this->calculator->compute($baselineInputs);

        if ($input->isEmpty()) {
            return new SimulationResult(
                baseline: $baseline,
                simulated: $baseline,
                delta: $this->computeDelta($baseline, $baseline),
                suggestions: [],
                input: $input,
            );
        }

        // 3. Apply overrides in-memory
        $simulatedCapacitiesMap  = $this->applyCapacityOverrides($baselineInputs->capacitiesMap, $input);
        $simulatedAllocations    = $this->applyAllocationOverrides($currentAllocations, $input);
        $simulatedAllocations    = $this->applyTeamChanges($simulatedAllocations, $input);
        $simulatedActiveProjects = $this->applyDeadlineOverrides($baselineInputs->activeProjects, $input);

        // 4. Build simulated load
        $simulatedWeeklyByUser  = $this->deriveWeeklyLoad($simulatedAllocations, $simulatedCapacitiesMap, $now);
        $simulatedMonthlyByUser = $this->deriveMonthlyLoad($simulatedAllocations, $simulatedCapacitiesMap, $now, $baselineInputs->weeksInMonth);

        $simulatedCapacityInputs = new CapacityInputs(
            users: $baselineInputs->users,
            capacitiesMap: $simulatedCapacitiesMap,
            weeklyByUser: $simulatedWeeklyByUser,
            monthlyByUser: $simulatedMonthlyByUser,
            weeksInMonth: $baselineInputs->weeksInMonth,
            periods: $baselineInputs->periods,
            activeProjects: $simulatedActiveProjects,
            historyByYwAndUser: $baselineInputs->historyByYwAndUser,
            now: $now,
            forecastAllocations: $simulatedAllocations,
        );

        $simulated = $this->calculator->compute($simulatedCapacityInputs);

        // 5. Compute delta and suggestions
        $delta       = $this->computeDelta($baseline, $simulated);
        $suggestions = $this->suggestionEngine->generate(
            $baseline,
            $simulated,
            $input,
            $simulatedCapacitiesMap,
            $simulatedAllocations,
            $now,
        );

        return new SimulationResult(
            baseline: $baseline,
            simulated: $simulated,
            delta: $delta,
            suggestions: $suggestions,
            input: $input,
        );
    }

    // ── Load derivation from allocations ─────────────────────────────────────

    /**
     * Derive weekly load (hours) per user from active allocations.
     * Contribution = (percentage / 100) * weeklyCapacity for allocations active this week.
     */
    private function deriveWeeklyLoad(Collection $allocations, array $capacitiesMap, Carbon $now): array
    {
        $weekStart = $now->copy()->startOfWeek();
        $weekEnd   = $now->copy()->endOfWeek();

        return $this->computeLoadFromAllocations($allocations, $capacitiesMap, $weekStart, $weekEnd);
    }

    private function deriveMonthlyLoad(Collection $allocations, array $capacitiesMap, Carbon $now, int $weeksInMonth): array
    {
        $weekly = $this->deriveWeeklyLoad($allocations, $capacitiesMap, $now);

        return array_map(fn ($h) => $h * $weeksInMonth, $weekly);
    }

    private function computeLoadFromAllocations(Collection $allocations, array $capacitiesMap, Carbon $from, Carbon $to): array
    {
        $loadByUser = [];

        foreach ($allocations as $allocation) {
            if (! $this->overlaps($allocation->start_date, $allocation->end_date, $from, $to)) {
                continue;
            }

            $userId = $allocation->user_id;
            $contribution = $this->weeklyContributionFromAllocation($allocation);

            $loadByUser[$userId] = ($loadByUser[$userId] ?? 0.0) + $contribution;
        }

        return $loadByUser;
    }

    /**
     * Derive a single allocation's weekly hour contribution.
     * Primary: allocated_hours / weeks_in_period (keeps load fixed when capacity changes).
     * Fallback: percentage * defaultCapacity (for new allocations that only have percentage).
     */
    private function weeklyContributionFromAllocation(object $allocation): float
    {
        $allocatedHours = (int) ($allocation->allocated_hours ?? 0);

        if ($allocatedHours > 0) {
            $start = $allocation->start_date instanceof Carbon
                ? $allocation->start_date
                : Carbon::parse($allocation->start_date);
            $end = $allocation->end_date instanceof Carbon
                ? $allocation->end_date
                : Carbon::parse($allocation->end_date);

            $weeksInPeriod = max(1, (int) ceil($start->diffInDays($end->copy()->addDay()) / 7));

            return $allocatedHours / $weeksInPeriod;
        }

        // Fallback: percentage × 40h default (used when only percentage is set, no hours)
        $pct = (int) ($allocation->percentage ?? 0);

        return ($pct / 100) * 40;
    }

    private function overlaps(mixed $startDate, mixed $endDate, Carbon $from, Carbon $to): bool
    {
        if ($startDate === null || $endDate === null) {
            return false;
        }

        $start = $startDate instanceof Carbon ? $startDate : Carbon::parse($startDate);
        $end   = $endDate instanceof Carbon ? $endDate : Carbon::parse($endDate);

        return $start->lte($to) && $end->gte($from);
    }

    // ── Override application ──────────────────────────────────────────────────

    private function applyCapacityOverrides(array $capacitiesMap, SimulationInput $input): array
    {
        foreach ($input->capacityOverrides as $userId => $newHours) {
            $capacitiesMap[(int) $userId] = (int) $newHours;
        }

        return $capacitiesMap;
    }

    /**
     * Apply allocation overrides to an in-memory copy of allocations.
     * Returns a new Collection of plain objects (never modifies DB).
     */
    private function applyAllocationOverrides(Collection $allocations, SimulationInput $input): Collection
    {
        // Work on mutable array of plain objects
        $items = $allocations->map(fn ($a) => $this->cloneAllocation($a))->all();

        foreach ($input->allocationOverrides as $override) {
            if ($override->delete) {
                // Mark for deletion
                $items = array_filter($items, function ($item) use ($override) {
                    if ($override->allocationId !== null) {
                        return $item->id !== $override->allocationId;
                    }
                    // No ID: match by project + user
                    return ! ($item->project_id === $override->projectId && $item->user_id === $override->userId);
                });
                continue;
            }

            if ($override->allocationId !== null) {
                // Update existing allocation
                foreach ($items as &$item) {
                    if ($item->id === $override->allocationId) {
                        if ($override->allocatedHours !== null) {
                            $item->allocated_hours = $override->allocatedHours;
                        } elseif ($override->percentage !== null && (int) $item->percentage > 0) {
                            // Percentage changed but hours not explicitly set → scale hours proportionally
                            $item->allocated_hours = (int) round(($override->percentage / $item->percentage) * $item->allocated_hours);
                        }
                        if ($override->percentage !== null) {
                            $item->percentage = $override->percentage;
                        }
                        if ($override->startDate !== null) {
                            $item->start_date = Carbon::instance($override->startDate);
                        }
                        if ($override->endDate !== null) {
                            $item->end_date = Carbon::instance($override->endDate);
                        }
                        break;
                    }
                }
                unset($item);
            } else {
                // New allocation
                $items[] = (object) [
                    'id' => null,
                    'project_id' => $override->projectId,
                    'user_id' => $override->userId,
                    'allocated_hours' => $override->allocatedHours ?? 0,
                    'used_hours' => 0,
                    'percentage' => $override->percentage ?? 0,
                    'start_date' => $override->startDate ? Carbon::instance($override->startDate) : Carbon::now()->startOfMonth(),
                    'end_date' => $override->endDate ? Carbon::instance($override->endDate) : Carbon::now()->endOfMonth(),
                    'notes' => null,
                ];
            }
        }

        return collect(array_values($items));
    }

    /** Apply team changes: REMOVE drops allocations, ADD with associated override is handled by applyAllocationOverrides */
    private function applyTeamChanges(Collection $allocations, SimulationInput $input): Collection
    {
        $items = $allocations->all();

        foreach ($input->teamChanges as $change) {
            if ($change->action === SimulationTeamAction::REMOVE) {
                $items = array_filter($items, fn ($item) => !(
                    $item->project_id === $change->projectId && $item->user_id === $change->userId
                ));
            }
            // ADD is handled via AllocationOverride — no separate allocation created here
        }

        return collect(array_values($items));
    }

    private function applyDeadlineOverrides(Collection $activeProjects, SimulationInput $input): Collection
    {
        if (empty($input->deadlineOverrides)) {
            return $activeProjects;
        }

        $overrideMap = [];
        foreach ($input->deadlineOverrides as $override) {
            $overrideMap[$override->projectId] = $override->newEndDate;
        }

        return $activeProjects->map(function ($project) use ($overrideMap) {
            if (! isset($overrideMap[$project->id])) {
                return $project;
            }

            // Clone the project object with the new end_date
            $clone           = clone $project;
            $clone->end_date = Carbon::instance($overrideMap[$project->id]);

            return $clone;
        });
    }

    private function cloneAllocation(object $allocation): object
    {
        return (object) [
            'id' => $allocation->id,
            'project_id' => $allocation->project_id,
            'user_id' => $allocation->user_id,
            'allocated_hours' => $allocation->allocated_hours,
            'used_hours' => $allocation->used_hours,
            'percentage' => $allocation->percentage,
            'start_date' => $allocation->start_date,
            'end_date' => $allocation->end_date,
            'notes' => $allocation->notes ?? null,
        ];
    }

    // ── Delta computation ─────────────────────────────────────────────────────

    private function computeDelta(array $baseline, array $simulated): array
    {
        $baselineWeeklyUtil  = $baseline['weekly_overview']['utilization'] ?? 0;
        $simulatedWeeklyUtil = $simulated['weekly_overview']['utilization'] ?? 0;

        $baselineMonthlyUtil  = $baseline['monthly_overview']['utilization'] ?? 0;
        $simulatedMonthlyUtil = $simulated['monthly_overview']['utilization'] ?? 0;

        $baselineConfidence  = $baseline['prediction']['confidence'] ?? 0;
        $simulatedConfidence = $simulated['prediction']['confidence'] ?? 0;

        $baselineRemaining  = $baseline['prediction']['remaining_project_hours'] ?? 0;
        $simulatedRemaining = $simulated['prediction']['remaining_project_hours'] ?? 0;

        // Users over capacity
        $baselineOverIds  = collect($baseline['alerts'])->pluck('id')->all();
        $simulatedOverIds = collect($simulated['alerts'])->pluck('id')->all();

        $addedOverIds    = array_diff($simulatedOverIds, $baselineOverIds);
        $resolvedOverIds = array_diff($baselineOverIds, $simulatedOverIds);

        $baselinePeople  = collect($baseline['people'])->keyBy('id');
        $simulatedPeople = collect($simulated['people'])->keyBy('id');

        $usersAdded    = collect($addedOverIds)->map(fn ($id) => [
            'id'    => $id,
            'name'  => $simulatedPeople[$id]['name'] ?? '',
            'before' => $baselinePeople[$id]['weekly_utilization'] ?? 0,
            'after'  => $simulatedPeople[$id]['weekly_utilization'] ?? 0,
        ])->values()->all();

        $usersResolved = collect($resolvedOverIds)->map(fn ($id) => [
            'id'    => $id,
            'name'  => $baselinePeople[$id]['name'] ?? '',
            'before' => $baselinePeople[$id]['weekly_utilization'] ?? 0,
            'after'  => $simulatedPeople[$id]['weekly_utilization'] ?? 0,
        ])->values()->all();

        // Projects at risk (can_finish = false)
        $baselineProjects  = collect($baseline['prediction']['projects'] ?? [])->keyBy('id');
        $simulatedProjects = collect($simulated['prediction']['projects'] ?? [])->keyBy('id');

        $baselineRiskIds  = $baselineProjects->where('can_finish', false)->pluck('id')->all();
        $simulatedRiskIds = $simulatedProjects->where('can_finish', false)->pluck('id')->all();

        $projectsRiskAdded    = array_diff($simulatedRiskIds, $baselineRiskIds);
        $projectsRiskResolved = array_diff($baselineRiskIds, $simulatedRiskIds);

        $projectsAtRiskAdded = collect($projectsRiskAdded)->map(fn ($id) => [
            'id'         => $id,
            'name'       => $simulatedProjects[$id]['name'] ?? '',
            'hours_short' => max(0, ($simulatedProjects[$id]['remaining_hours'] ?? 0) - ($simulatedProjects[$id]['available_hours_next_4_weeks'] ?? 0)),
        ])->values()->all();

        $projectsAtRiskResolved = collect($projectsRiskResolved)->map(fn ($id) => [
            'id'   => $id,
            'name' => $baselineProjects[$id]['name'] ?? '',
        ])->values()->all();

        // Per-user delta
        $allUserIds = $baselinePeople->keys()->merge($simulatedPeople->keys())->unique();
        $perUser = $allUserIds->map(fn ($id) => [
            'id'                     => $id,
            'name'                   => ($baselinePeople[$id] ?? $simulatedPeople[$id])['name'],
            'weekly_util_before'     => $baselinePeople[$id]['weekly_utilization'] ?? 0,
            'weekly_util_after'      => $simulatedPeople[$id]['weekly_utilization'] ?? 0,
            'free_capacity_before'   => $baselinePeople[$id]['free_capacity_hours'] ?? 0,
            'free_capacity_after'    => $simulatedPeople[$id]['free_capacity_hours'] ?? 0,
        ])->values()->all();

        // Per-project delta
        $allProjectIds = $baselineProjects->keys()->merge($simulatedProjects->keys())->unique();
        $perProject = $allProjectIds->map(fn ($id) => [
            'id'                  => $id,
            'name'                => ($baselineProjects[$id] ?? $simulatedProjects[$id])['name'],
            'can_finish_before'   => $baselineProjects[$id]['can_finish'] ?? true,
            'can_finish_after'    => $simulatedProjects[$id]['can_finish'] ?? true,
            'confidence_before'   => $baselineProjects[$id]['confidence'] ?? 0,
            'confidence_after'    => $simulatedProjects[$id]['confidence'] ?? 0,
            'days_remaining_before' => $baselineProjects[$id]['days_remaining'] ?? 0,
            'days_remaining_after'  => $simulatedProjects[$id]['days_remaining'] ?? 0,
            'is_overdue_before'   => $baselineProjects[$id]['is_overdue'] ?? false,
            'is_overdue_after'    => $simulatedProjects[$id]['is_overdue'] ?? false,
        ])->values()->all();

        return [
            'weekly_utilization_pp'          => round($simulatedWeeklyUtil - $baselineWeeklyUtil, 1),
            'monthly_utilization_pp'         => round($simulatedMonthlyUtil - $baselineMonthlyUtil, 1),
            'confidence_pp'                  => round($simulatedConfidence - $baselineConfidence, 1),
            'remaining_project_hours_delta'  => round($simulatedRemaining - $baselineRemaining, 2),
            'users_over_capacity_added'      => $usersAdded,
            'users_over_capacity_resolved'   => $usersResolved,
            'projects_at_risk_added'         => $projectsAtRiskAdded,
            'projects_at_risk_resolved'      => $projectsAtRiskResolved,
            'per_user'                       => $perUser,
            'per_project'                    => $perProject,
        ];
    }
}
