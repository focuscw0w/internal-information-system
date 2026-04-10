<?php

namespace Modules\CapacityManagement\Services;

use Modules\CapacityManagement\DTO\CapacityInputs;

/**
 * Pure capacity calculator — no DB calls, no side effects.
 * Receives all required data via CapacityInputs and returns the same shape
 * as CapacityManagementService::buildDashboard().
 */
class CapacityCalculator
{
    /**
     * Compute the full capacity dashboard data from pre-fetched inputs.
     *
     * @return array{
     *     people: array,
     *     alerts: array,
     *     free_people: array,
     *     weekly_overview: array,
     *     monthly_overview: array,
     *     prediction: array,
     *     history: array
     * }
     */
    public function compute(CapacityInputs $inputs): array
    {
        $people = $inputs->users->map(function ($user) use ($inputs) {
            $weeklyCapacity = $inputs->capacitiesMap[$user->id] ?? 40;
            $weeklyLoadHours = (float) ($inputs->weeklyByUser[$user->id] ?? 0);
            $monthlyLoadHours = (float) ($inputs->monthlyByUser[$user->id] ?? 0);
            $monthlyCapacity = $weeklyCapacity * $inputs->weeksInMonth;

            $utilization = $this->toPercentage($weeklyLoadHours, $weeklyCapacity);
            $monthlyUtilization = $this->toPercentage($monthlyLoadHours, $monthlyCapacity);
            $freeCapacity = max(0, $weeklyCapacity - $weeklyLoadHours);

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'weekly_capacity_hours' => $weeklyCapacity,
                'weekly_load_hours' => round($weeklyLoadHours, 2),
                'weekly_utilization' => $utilization,
                'monthly_load_hours' => round($monthlyLoadHours, 2),
                'monthly_capacity_hours' => $monthlyCapacity,
                'monthly_utilization' => $monthlyUtilization,
                'free_capacity_hours' => round($freeCapacity, 2),
                'status' => $this->statusByUtilization($utilization),
                'is_over_capacity' => $utilization > 100,
                'history' => $this->buildUserHistory($user->id, $inputs),
            ];
        })->values();

        $overview = $this->buildOverview($people);

        return [
            'people' => $people,
            'alerts' => $this->buildAlerts($people),
            'free_people' => $this->getFreePeople($people),
            'weekly_overview' => $overview['weekly'],
            'monthly_overview' => $overview['monthly'],
            'prediction' => $this->buildPrediction($overview['weekly']['capacity_hours'], $inputs),
            'history' => $this->buildTeamHistory($inputs),
        ];
    }

    // ── People ────────────────────────────────────────────────────────────────

    private function buildOverview($people): array
    {
        $teamWeeklyCapacity = (int) $people->sum('weekly_capacity_hours');
        $teamWeeklyLoad = (float) $people->sum('weekly_load_hours');
        $teamMonthlyCapacity = (int) $people->sum('monthly_capacity_hours');
        $teamMonthlyLoad = (float) $people->sum('monthly_load_hours');

        return [
            'weekly' => [
                'capacity_hours' => $teamWeeklyCapacity,
                'load_hours' => round($teamWeeklyLoad, 2),
                'utilization' => $this->toPercentage($teamWeeklyLoad, $teamWeeklyCapacity),
            ],
            'monthly' => [
                'capacity_hours' => $teamMonthlyCapacity,
                'load_hours' => round($teamMonthlyLoad, 2),
                'utilization' => $this->toPercentage($teamMonthlyLoad, $teamMonthlyCapacity),
            ],
        ];
    }

    private function getFreePeople($people)
    {
        return $people
            ->where('weekly_utilization', '<', 80)
            ->sortByDesc('free_capacity_hours')
            ->values();
    }

    private function buildAlerts($people)
    {
        return $people
            ->where('is_over_capacity', true)
            ->map(fn (array $person) => [
                'id' => $person['id'],
                'name' => $person['name'],
                'weekly_utilization' => $person['weekly_utilization'],
            ])->values();
    }

    // ── Prediction ────────────────────────────────────────────────────────────

    private function buildPrediction(int $teamWeeklyCapacity, CapacityInputs $inputs): array
    {
        $availableNextFourWeeks = $teamWeeklyCapacity * 4;

        $perProject = $inputs->activeProjects->map(function ($project) use ($availableNextFourWeeks, $inputs) {
            $remaining = (float) $project->tasks->sum(
                fn ($task) => max(0, (int) ($task->estimated_hours ?? 0) - (int) ($task->actual_hours ?? 0))
            );

            $endDate = $project->end_date instanceof \Carbon\Carbon
                ? $project->end_date
                : ($project->end_date ? \Carbon\Carbon::parse($project->end_date) : null);

            return [
                'id' => $project->id,
                'name' => $project->name,
                'remaining_hours' => round($remaining, 2),
                'available_hours_next_4_weeks' => $availableNextFourWeeks,
                'can_finish' => $availableNextFourWeeks >= $remaining,
                'confidence' => min(100, $this->toPercentage($availableNextFourWeeks, max(1.0, $remaining))),
                'days_remaining' => $endDate ? max(0, (int) $inputs->now->diffInDays($endDate, false)) : 0,
                'is_overdue' => $endDate !== null && $endDate->lt($inputs->now),
            ];
        })->values();

        $totalRemaining = (float) $perProject->sum('remaining_hours');

        return [
            'remaining_project_hours' => round($totalRemaining, 2),
            'available_hours_next_4_weeks' => $availableNextFourWeeks,
            'can_finish' => $availableNextFourWeeks >= $totalRemaining,
            'confidence' => min(100, $this->toPercentage($availableNextFourWeeks, max(1.0, $totalRemaining))),
            'projects' => $perProject,
        ];
    }

    // ── History ───────────────────────────────────────────────────────────────

    private function buildTeamHistory(CapacityInputs $inputs): array
    {
        $totalTeamCapacity = max(1, array_sum($inputs->capacitiesMap));
        $teamHistory = [];

        for ($i = 11; $i >= 0; $i--) {
            $weekStart = $inputs->now->copy()->startOfWeek()->subWeeks($i);
            $weekEnd = $weekStart->copy()->endOfWeek();
            $yw = $weekStart->format('o-W');

            $weekUserHours = $inputs->historyByYwAndUser[$yw] ?? [];
            $teamLoad = (float) array_sum($weekUserHours);

            $activeUserCapacity = 0;
            foreach (array_keys($weekUserHours) as $uid) {
                $activeUserCapacity += $inputs->capacitiesMap[$uid] ?? 40;
            }
            $weekCapacity = $activeUserCapacity > 0 ? $activeUserCapacity : $totalTeamCapacity;

            $label = $weekStart->format('d.m').'-'.$weekEnd->format('d.m');

            $teamHistory[] = [
                'week_label' => $label,
                'load_hours' => round($teamLoad, 2),
                'utilization' => $this->toPercentage($teamLoad, $weekCapacity),
            ];
        }

        return $teamHistory;
    }

    private function buildUserHistory(int $userId, CapacityInputs $inputs): array
    {
        $userCap = $inputs->capacitiesMap[$userId] ?? 40;
        $history = [];

        for ($i = 11; $i >= 0; $i--) {
            $weekStart = $inputs->now->copy()->startOfWeek()->subWeeks($i);
            $weekEnd = $weekStart->copy()->endOfWeek();
            $yw = $weekStart->format('o-W');

            $userLoad = (float) ($inputs->historyByYwAndUser[$yw][$userId] ?? 0);

            $history[] = [
                'week_label' => $weekStart->format('d.m').'-'.$weekEnd->format('d.m'),
                'load_hours' => round($userLoad, 2),
                'utilization' => $this->toPercentage($userLoad, $userCap),
            ];
        }

        return $history;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function toPercentage(float $part, float $whole): float
    {
        if ($whole <= 0) {
            return 0;
        }

        return round(($part / $whole) * 100, 1);
    }

    public function statusByUtilization(float $utilization): string
    {
        return match (true) {
            $utilization < 80 => 'green',
            $utilization <= 100 => 'orange',
            default => 'red',
        };
    }
}
