<?php

namespace Modules\CapacityManagement\Services;

use Carbon\Carbon;
use Modules\CapacityManagement\Models\EmployeeCapacity;
use Modules\Project\Models\Project;
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

        // Build capacities map (user_id => hours) with defaults
        $capacitiesMap = $users->mapWithKeys(fn (User $u) => [
            $u->id => (int) ($capacities[$u->id] ?? 40),
        ])->all();

        $userIds = $users->pluck('id')->all();

        $history = $this->buildHistory($capacitiesMap, $userIds);

        $people = $users->map(function (User $user) use ($weeklyByUser, $monthlyByUser, $capacitiesMap, $weeksInMonth, $history) {
            $weeklyCapacity = $capacitiesMap[$user->id];
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
                'history' => $history['by_user'][$user->id] ?? [],
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
            'prediction' => $this->buildPrediction($people, $teamWeeklyCapacity),
            'history' => $history['team'],
        ];
    }

    public function setWeeklyCapacityForUser(int $userId, int $hours): void
    {
        EmployeeCapacity::query()->updateOrCreate(
            ['user_id' => $userId],
            ['weekly_capacity_hours' => $hours],
        );
    }

    private function buildPrediction($people, int $teamWeeklyCapacity): array
    {
        $activeProjects = Project::query()
            ->where('status', 'active')
            ->with(['tasks' => fn ($q) => $q->whereNotIn('status', ['done'])
                ->select('id', 'project_id', 'estimated_hours', 'actual_hours'),
            ])
            ->get(['id', 'name', 'end_date']);

        $availableNextFourWeeks = $teamWeeklyCapacity * 4;

        $perProject = $activeProjects->map(function (Project $project) use ($availableNextFourWeeks) {
            $remaining = (float) $project->tasks->sum(
                fn ($task) => max(0, (int) ($task->estimated_hours ?? 0) - (int) ($task->actual_hours ?? 0))
            );

            return [
                'id' => $project->id,
                'name' => $project->name,
                'remaining_hours' => round($remaining, 2),
                'available_hours_next_4_weeks' => $availableNextFourWeeks,
                'can_finish' => $availableNextFourWeeks >= $remaining,
                'confidence' => min(100, $this->toPercentage($availableNextFourWeeks, max(1.0, $remaining))),
                'days_remaining' => max(0, (int) now()->diffInDays($project->end_date, false)),
                'is_overdue' => $project->end_date !== null && $project->end_date < now(),
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

    /**
     * Build 12-week history for the team and per-user in a single batch query.
     */
    private function buildHistory(array $capacitiesMap, array $userIds): array
    {
        $twelveWeeksAgo = Carbon::now()->startOfWeek()->subWeeks(11);
        $totalTeamCapacity = max(1, array_sum($capacitiesMap));

        // Single batch query: all entries in the 12-week window grouped by user and ISO year-week
        $rawEntries = TimeEntry::query()
            ->where('entry_date', '>=', $twelveWeeksAgo)
            ->get()
            ->groupBy(function ($entry) {
                return $entry->user_id.'-'.$entry->entry_date->format('o-W'); // ISO week
            })
            ->map(function ($group) {
                return [
                    'user_id' => $group->first()->user_id,
                    'yw' => $group->first()->entry_date->format('o-W'),
                    'total' => $group->sum('hours'),
                ];
            })
            ->values();

        $byYwAndUser = [];
        foreach ($rawEntries as $row) {
            $byYwAndUser[$row['yw']][$row['user_id']] = (float) $row['total'];
        }

        $teamHistory = [];
        $byUser = array_fill_keys($userIds, []);

        for ($i = 11; $i >= 0; $i--) {
            $weekStart = Carbon::now()->startOfWeek()->subWeeks($i);
            $weekEnd = $weekStart->copy()->endOfWeek();
            $yw = $weekStart->format('o-W'); // ISO year-week string, e.g. "2026-14"

            $weekUserHours = $byYwAndUser[$yw] ?? [];

            // Team load for this week
            $teamLoad = (float) array_sum($weekUserHours);

            // Per-week capacity: sum capacities of users who had entries;
            // fall back to total team capacity when nobody logged anything
            $activeUserCapacity = 0;
            foreach (array_keys($weekUserHours) as $uid) {
                $activeUserCapacity += $capacitiesMap[$uid] ?? 40;
            }
            $weekCapacity = $activeUserCapacity > 0 ? $activeUserCapacity : $totalTeamCapacity;

            $label = $weekStart->format('d.m').'-'.$weekEnd->format('d.m');

            $teamHistory[] = [
                'week_label' => $label,
                'load_hours' => round($teamLoad, 2),
                'utilization' => $this->toPercentage($teamLoad, $weekCapacity),
            ];

            foreach ($userIds as $uid) {
                $userLoad = (float) ($weekUserHours[$uid] ?? 0);
                $userCap = $capacitiesMap[$uid] ?? 40;
                $byUser[$uid][] = [
                    'week_label' => $label,
                    'load_hours' => round($userLoad, 2),
                    'utilization' => $this->toPercentage($userLoad, $userCap),
                ];
            }
        }

        return ['team' => $teamHistory, 'by_user' => $byUser];
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
