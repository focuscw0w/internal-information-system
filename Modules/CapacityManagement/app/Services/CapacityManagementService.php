<?php

namespace Modules\CapacityManagement\Services;

use Carbon\Carbon;
use Modules\CapacityManagement\Contracts\CapacityManagementServiceInterface;
use Modules\CapacityManagement\DTO\CapacityInputs;
use Modules\CapacityManagement\Models\EmployeeCapacity;
use Modules\Project\Contracts\ProjectServiceInterface;
use Modules\Project\Models\ProjectAllocation;
use Modules\Project\Services\ProjectAllocationSyncService;
use Modules\TimeTracking\Contracts\TimeEntryServiceInterface;
use Modules\User\Contracts\UserServiceInterface;

class CapacityManagementService implements CapacityManagementServiceInterface
{
    public function __construct(
        private readonly UserServiceInterface $userService,
        private readonly TimeEntryServiceInterface $timeEntryService,
        private readonly ProjectServiceInterface $projectService,
        private readonly CapacityCalculator $calculator,
        private readonly ProjectAllocationSyncService $allocationSyncService,
    ) {}

    /**
     * Build capacity dashboard data for the whole team.
     */
    public function buildDashboard(): array
    {
        return $this->calculator->compute($this->buildInputs());
    }

    public function getPeopleSnapshotForUsers(array $userIds): array
    {
        $userIds = array_values(array_unique(array_map('intval', $userIds)));

        if ($userIds === []) {
            return [];
        }

        return collect($this->buildDashboard()['people'] ?? [])
            ->whereIn('id', $userIds)
            ->keyBy('id')
            ->map(fn ($person) => [
                'weekly_capacity_hours' => (int) ($person['weekly_capacity_hours'] ?? 40),
                'weekly_load_hours' => (float) ($person['weekly_load_hours'] ?? 0),
                'weekly_utilization' => (float) ($person['weekly_utilization'] ?? 0),
                'free_capacity_hours' => (float) ($person['free_capacity_hours'] ?? 0),
                'is_over_capacity' => (bool) ($person['is_over_capacity'] ?? false),
            ])
            ->all();
    }

    /**
     * Store weekly capacity hours for a user.
     */
    public function setWeeklyCapacityForUser(int $userId, int $hours): void
    {
        EmployeeCapacity::query()->updateOrCreate(
            ['user_id' => $userId],
            ['weekly_capacity_hours' => $hours],
        );

        $this->allocationSyncService->syncAllocationsForUserProjects($userId);
    }

    /**
     * Fetch all live data from DB and build a CapacityInputs instance.
     * Exposed internally so SimulationService can reuse the same fetch.
     */
    public function buildInputs(?Carbon $now = null): CapacityInputs
    {
        $now ??= Carbon::now();

        $users = $this->userService->getAllUsers();
        $periods = $this->getDashboardPeriods($now);

        $capacities = EmployeeCapacity::query()->pluck('weekly_capacity_hours', 'user_id');
        $weeksInMonth = max(1, (int) ceil(
            $periods['start_of_month']->diffInDays($periods['end_of_month']->copy()->addDay()) / 7
        ));

        $capacitiesMap = $users->mapWithKeys(fn ($user) => [
            $user->id => (int) ($capacities[$user->id] ?? 40),
        ])->all();

        $weeklyByUser = $this->timeEntryService
            ->getTotalHoursPerUserInPeriod($periods['start_of_week'], $periods['end_of_week'])
            ->toArray();

        $monthlyByUser = $this->timeEntryService
            ->getTotalHoursPerUserInPeriod($periods['start_of_month'], $periods['end_of_month'])
            ->toArray();

        $twelveWeeksAgo = $now->copy()->startOfWeek()->subWeeks(11);
        $historyByYwAndUser = $this->timeEntryService
            ->getHoursGroupedByWeekAndUser($twelveWeeksAgo, $now);

        $activeProjects = $this->projectService->getActiveProjectsWithIncompleteTasks();
        $forecastAllocations = ProjectAllocation::query()
            ->whereIn('project_id', $activeProjects->pluck('id'))
            ->get();

        return new CapacityInputs(
            users: $users,
            capacitiesMap: $capacitiesMap,
            weeklyByUser: $weeklyByUser,
            monthlyByUser: $monthlyByUser,
            weeksInMonth: $weeksInMonth,
            periods: $periods,
            activeProjects: $activeProjects,
            historyByYwAndUser: $historyByYwAndUser,
            now: $now,
            forecastAllocations: $forecastAllocations,
        );
    }

    private function getDashboardPeriods(Carbon $now): array
    {
        return [
            'start_of_week' => $now->copy()->startOfWeek(),
            'end_of_week' => $now->copy()->endOfWeek(),
            'start_of_month' => $now->copy()->startOfMonth(),
            'end_of_month' => $now->copy()->endOfMonth(),
        ];
    }
}
