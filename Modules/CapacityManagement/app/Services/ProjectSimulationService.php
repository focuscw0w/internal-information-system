<?php

namespace Modules\CapacityManagement\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\CapacityManagement\Contracts\ProjectSimulationInterface;
use Modules\CapacityManagement\Contracts\Repositories\CapacityForecastRepositoryInterface;
use Modules\CapacityManagement\Contracts\Repositories\EmployeeCapacityRepositoryInterface;
use Modules\CapacityManagement\DTO\ProjectSimulationInput;
use Modules\CapacityManagement\DTO\ProjectSimulationResult;
use Modules\Project\Models\Project;

class ProjectSimulationService implements ProjectSimulationInterface
{
    public function __construct(
        private readonly CapacityForecastRepositoryInterface $forecastRepository,
        private readonly EmployeeCapacityRepositoryInterface $employeeCapacities,
    ) {}

    /**
     * Run an in-memory burn-down simulation for a single project.
     * Nothing is persisted to the database.
     */
    public function simulate(Project $project, ProjectSimulationInput $input): ProjectSimulationResult
    {
        $now = Carbon::now()->startOfDay();

        // Load project tasks for remaining hours
        $project->loadMissing('tasks');

        // Load all allocations for this project (not just currently active)
        $allocations = $this->forecastRepository->allocationsForProject($project->id);

        // Load employee capacities
        $capacitiesMap = $this->employeeCapacities->weeklyCapacityMap();

        // --- Baseline values ---
        $baselineRemainingHours  = $this->calculateRemainingHours($project);
        $baselineTeamSize        = $allocations->pluck('user_id')->unique()->count();
        $baselineWeeklyCapacity  = $this->calculateWeeklyCapacity($allocations, $capacitiesMap);

        $baselineDeadline = $project->end_date instanceof Carbon
            ? $project->end_date->copy()->startOfDay()
            : ($project->end_date ? Carbon::parse($project->end_date)->startOfDay() : $now->copy()->addMonths(3));

        // --- Apply overrides ---
        $simRemainingHours  = $input->remainingHours !== null ? (float) $input->remainingHours : $baselineRemainingHours;
        $simDeadline        = $baselineDeadline->copy()->addDays($input->deadlineDaysShift);
        $simTeamSize        = $input->teamSize !== null ? $input->teamSize : $baselineTeamSize;
        $simWeeklyCapacity  = $this->simulateWeeklyCapacity($baselineWeeklyCapacity, $baselineTeamSize, $simTeamSize);

        // --- Forecast finish date ---
        $forecastFinishDate = $this->calculateForecastFinish($now, $simRemainingHours, $simWeeklyCapacity);
        $finishDiffDays     = $forecastFinishDate !== null
            ? (int) round($forecastFinishDate->diffInDays($simDeadline, false))
            : null;
        $willMeetDeadline = $forecastFinishDate !== null && $forecastFinishDate->lte($simDeadline);

        // --- Build burn-down chart points ---
        $burnDownPoints = $this->buildBurnDownPoints(
            $now,
            $baselineRemainingHours,
            $simRemainingHours,
            $baselineDeadline,
            $simDeadline,
            $baselineWeeklyCapacity,
            $simWeeklyCapacity,
        );

        return new ProjectSimulationResult(
            projectId:               $project->id,
            projectName:             $project->name,
            baselineDeadline:        $baselineDeadline->toDateString(),
            simulatedDeadline:       $simDeadline->toDateString(),
            baselineRemainingHours:  round($baselineRemainingHours, 1),
            simulatedRemainingHours: round($simRemainingHours, 1),
            baselineWeeklyCapacity:  round($baselineWeeklyCapacity, 1),
            simulatedWeeklyCapacity: round($simWeeklyCapacity, 1),
            baselineTeamSize:        $baselineTeamSize,
            simulatedTeamSize:       $simTeamSize,
            forecastFinishDate:      $forecastFinishDate?->toDateString(),
            finishDiffDays:          $finishDiffDays,
            willMeetDeadline:        $willMeetDeadline,
            burnDownPoints:          $burnDownPoints,
        );
    }

    // ── Calculations ─────────────────────────────────────────────────────────

    private function calculateRemainingHours(Project $project): float
    {
        if ($project->tasks->isEmpty()) {
            return 0.0;
        }

        return (float) $project->tasks->sum(
            fn ($task) => max(0, (float) ($task->estimated_hours ?? 0) - (float) ($task->actual_hours ?? 0))
        );
    }

    private function calculateWeeklyCapacity(Collection $allocations, $capacitiesMap): float
    {
        return (float) $allocations->sum(fn ($alloc) => $this->weeklyContribution($alloc, $capacitiesMap));
    }

    /**
     * Scale weekly capacity based on team size change.
     * Uses per-person average so adding/removing people has a proportional effect.
     */
    private function simulateWeeklyCapacity(float $baselineCapacity, int $baselineTeamSize, int $simTeamSize): float
    {
        if ($baselineTeamSize === 0) {
            return $simTeamSize > 0 ? $simTeamSize * 20.0 : 0.0;
        }

        return $baselineCapacity * ($simTeamSize / $baselineTeamSize);
    }

    /**
     * Single allocation's weekly hour contribution.
     * Primary: allocated_hours / weeks_in_period.
     * Fallback: (percentage / 100) * capacity.
     */
    private function weeklyContribution(object $alloc, $capacitiesMap): float
    {
        $allocatedHours = (int) ($alloc->allocated_hours ?? 0);

        if ($allocatedHours > 0) {
            $start = $alloc->start_date instanceof Carbon
                ? $alloc->start_date
                : Carbon::parse($alloc->start_date);
            $end = $alloc->end_date instanceof Carbon
                ? $alloc->end_date
                : Carbon::parse($alloc->end_date);

            $weeksInPeriod = max(1, (int) ceil($start->diffInDays($end->copy()->addDay()) / 7));

            return $allocatedHours / $weeksInPeriod;
        }

        $pct      = (int) ($alloc->percentage ?? 0);
        $capacity = (int) ($capacitiesMap[$alloc->user_id] ?? 40);

        return ($pct / 100) * $capacity;
    }

    private function calculateForecastFinish(Carbon $now, float $remainingHours, float $weeklyCapacity): ?Carbon
    {
        if ($weeklyCapacity <= 0) {
            return null; // Never finishes
        }

        $weeksNeeded = ceil($remainingHours / $weeklyCapacity);

        return $now->copy()->addWeeks((int) $weeksNeeded);
    }

    // ── Burn-down chart ───────────────────────────────────────────────────────

    /**
     * Build weekly burn-down points for the chart.
     * Each point contains:
     *   - week_label: formatted date string
     *   - ideal_remaining: linear baseline plan (gray dashed)
     *   - forecast_remaining: simulated forecast (blue solid)
     *   - is_deadline_week: whether this point is the simulated deadline
     */
    private function buildBurnDownPoints(
        Carbon $now,
        float $baselineRemaining,
        float $simRemaining,
        Carbon $baselineDeadline,
        Carbon $simDeadline,
        float $baselineWeeklyCapacity,
        float $simWeeklyCapacity,
    ): array {
        $baselineDeadlineWeeks = max(0, (int) ceil($now->diffInDays($baselineDeadline, false) / 7));
        $simDeadlineWeeks      = max(0, (int) ceil($now->diffInDays($simDeadline, false) / 7));

        // How many weeks until simulated forecast reaches 0
        $forecastFinishWeeks = $simWeeklyCapacity > 0
            ? (int) ceil($simRemaining / $simWeeklyCapacity)
            : 999;

        // Chart range: cover both deadline and forecast finish, with a small buffer
        $totalWeeks = min(52, max($simDeadlineWeeks + 2, $forecastFinishWeeks + 2, 6));

        $points = [];

        for ($i = 0; $i <= $totalWeeks; $i++) {
            $weekDate = $now->copy()->addWeeks($i);

            // Ideal (baseline plan): linear from baselineRemaining → 0 over baselineDeadlineWeeks
            $idealRemaining = $baselineDeadlineWeeks > 0
                ? max(0.0, $baselineRemaining * (1 - $i / $baselineDeadlineWeeks))
                : ($i === 0 ? $baselineRemaining : 0.0);

            // Forecast (simulated): step-down by simulated weekly capacity
            $forecastRemaining = max(0.0, $simRemaining - $simWeeklyCapacity * $i);

            $points[] = [
                'week_label'        => $weekDate->format('d.m.'),
                'ideal_remaining'   => round($idealRemaining, 1),
                'forecast_remaining' => round($forecastRemaining, 1),
                'is_deadline_week'  => $i === $simDeadlineWeeks,
            ];
        }

        return $points;
    }
}
