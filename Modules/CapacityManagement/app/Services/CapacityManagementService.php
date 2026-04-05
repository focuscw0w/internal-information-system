<?php

namespace Modules\CapacityManagement\Services;

use Carbon\Carbon;
use Modules\CapacityManagement\Models\EmployeeCapacity;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;

class CapacityManagementService
{
    public function buildDashboard(): array
    {
        $users = User::query()->orderBy('name')->get(['id', 'name', 'email']);
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $weeklyByUser = TimeEntry::query()
            ->selectRaw('user_id, COALESCE(SUM(hours), 0) as total')
            ->whereBetween('entry_date', [$startOfWeek, $endOfWeek])
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        $monthlyByUser = TimeEntry::query()
            ->selectRaw('user_id, COALESCE(SUM(hours), 0) as total')
            ->whereBetween('entry_date', [$startOfMonth, $endOfMonth])
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        $capacities = EmployeeCapacity::query()->pluck('weekly_capacity_hours', 'user_id');
        $weeksInMonth = max(1, (int) ceil($startOfMonth->diffInDays($endOfMonth->copy()->addDay()) / 7));

        $people = $users->map(function (User $user) use ($weeklyByUser, $monthlyByUser, $capacities, $weeksInMonth) {
            $weeklyCapacity = (int) ($capacities[$user->id] ?? 40);
            $weeklyLoadHours = (float) ($weeklyByUser[$user->id] ?? 0);
            $monthlyLoadHours = (float) ($monthlyByUser[$user->id] ?? 0);
            $monthlyCapacity = $weeklyCapacity * $weeksInMonth;

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
            ];
        })->values();

        $teamWeeklyCapacity = (int) $people->sum('weekly_capacity_hours');
        $teamWeeklyLoad = (float) $people->sum('weekly_load_hours');
        $teamMonthlyCapacity = (int) $people->sum('monthly_capacity_hours');
        $teamMonthlyLoad = (float) $people->sum('monthly_load_hours');

        $freePeople = $people
            ->where('weekly_utilization', '<', 80)
            ->sortByDesc('free_capacity_hours')
            ->values();

        $alerts = $people
            ->where('is_over_capacity', true)
            ->map(fn (array $person) => [
                'id' => $person['id'],
                'name' => $person['name'],
                'weekly_utilization' => $person['weekly_utilization'],
            ])->values();

        return [
            'people' => $people,
            'alerts' => $alerts,
            'free_people' => $freePeople,
            'weekly_overview' => [
                'capacity_hours' => $teamWeeklyCapacity,
                'load_hours' => round($teamWeeklyLoad, 2),
                'utilization' => $this->toPercentage($teamWeeklyLoad, $teamWeeklyCapacity),
            ],
            'monthly_overview' => [
                'capacity_hours' => $teamMonthlyCapacity,
                'load_hours' => round($teamMonthlyLoad, 2),
                'utilization' => $this->toPercentage($teamMonthlyLoad, $teamMonthlyCapacity),
            ],
            'prediction' => $this->buildPrediction($people),
            'history' => $this->buildHistory($teamWeeklyCapacity),
        ];
    }

    public function setWeeklyCapacityForUser(int $userId, int $hours): void
    {
        EmployeeCapacity::query()->updateOrCreate(
            ['user_id' => $userId],
            ['weekly_capacity_hours' => $hours],
        );
    }

    private function buildPrediction($people): array
    {
        $remainingProjectHours = (float) Task::query()
            ->whereIn('project_id', Project::query()->where('status', 'active')->pluck('id'))
            ->selectRaw('COALESCE(SUM(
            CASE
                WHEN estimated_hours - actual_hours > 0
                THEN estimated_hours - actual_hours
                ELSE 0
            END
        ), 0) as remaining')
            ->value('remaining');

        $availableNextFourWeeks = (int) $people->sum('weekly_capacity_hours') * 4;

        return [
            'remaining_project_hours' => round($remainingProjectHours, 2),
            'available_hours_next_4_weeks' => $availableNextFourWeeks,
            'can_finish' => $availableNextFourWeeks >= $remainingProjectHours,
            'confidence' => $this->toPercentage($availableNextFourWeeks, max(1.0, $remainingProjectHours)),
        ];
    }

    private function buildHistory(int $teamWeeklyCapacity): array
    {
        $result = [];

        for ($i = 11; $i >= 0; $i--) {
            $weekStart = Carbon::now()->startOfWeek()->subWeeks($i);
            $weekEnd = $weekStart->copy()->endOfWeek();

            $load = (float) TimeEntry::query()
                ->whereBetween('entry_date', [$weekStart, $weekEnd])
                ->sum('hours');

            $result[] = [
                'week_label' => $weekStart->format('d.m').'-'.$weekEnd->format('d.m'),
                'load_hours' => round($load, 2),
                'utilization' => $this->toPercentage($load, max(1, $teamWeeklyCapacity)),
            ];
        }

        return $result;
    }

    private function toPercentage(float $part, float $whole): float
    {
        if ($whole <= 0) {
            return 0;
        }

        return round(($part / $whole) * 100, 1);
    }

    private function statusByUtilization(float $utilization): string
    {
        return match (true) {
            $utilization < 80 => 'green',
            $utilization <= 100 => 'orange',
            default => 'red',
        };
    }
}
