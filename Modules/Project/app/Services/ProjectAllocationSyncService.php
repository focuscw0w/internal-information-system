<?php

namespace Modules\Project\Services;

use Carbon\Carbon;
use Modules\CapacityManagement\Contracts\CapacityReaderInterface;
use Modules\Project\Contracts\ProjectAllocationSyncInterface;
use Modules\Project\Contracts\Repositories\ProjectAllocationRepositoryInterface;
use Modules\Project\Contracts\Repositories\ProjectRepositoryInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\ProjectAllocation;

class ProjectAllocationSyncService implements ProjectAllocationSyncInterface
{
    public function __construct(
        private readonly CapacityReaderInterface $capacityReader,
        private readonly ProjectRepositoryInterface $projects,
        private readonly ProjectAllocationRepositoryInterface $allocations,
    ) {}

    public function syncCurrentTeamAllocations(Project $project): void
    {
        $project->loadMissing('team');
        $teamUserIds = $project->team->pluck('id')->map(fn ($id) => (int) $id)->all();

        if ($teamUserIds === []) {
            $this->allocations->deleteForProject($project->id);

            return;
        }

        $this->allocations->deleteExceptUsers($project->id, $teamUserIds);

        $capacities = $this->capacityReader->getWeeklyCapacitiesForUsers($teamUserIds);

        foreach ($project->team as $member) {
            $memberId = (int) $member->id;
            $this->syncTeamMemberAllocation(
                $project,
                $memberId,
                (int) ($member->pivot->allocation ?? 100),
                $capacities[$memberId] ?? null,
            );
        }
    }

    public function syncAllocationsForUserProjects(int $userId): int
    {
        $projects = $this->projects->withTeamForUser($userId);

        foreach ($projects as $project) {
            $member = $project->team->firstWhere('id', $userId);

            if ($member === null) {
                continue;
            }

            $this->syncTeamMemberAllocation(
                $project,
                $userId,
                (int) ($member->pivot->allocation ?? 100),
                $this->resolveUserWeeklyCapacity($userId),
            );
        }

        return $projects->count();
    }

    public function syncAllProjectAllocations(): int
    {
        $projects = $this->projects->allWithTeam();

        foreach ($projects as $project) {
            $this->syncCurrentTeamAllocations($project);
        }

        return $projects->count();
    }

    public function removeAllocationsForUsers(Project $project, array $userIds): void
    {
        $userIds = array_values(array_unique(array_map('intval', $userIds)));

        if ($userIds === []) {
            return;
        }

        $this->allocations->deleteForProjectUsers($project->id, $userIds);
    }

    public function syncUsedHoursForProjectUser(int $projectId, int $userId): void
    {
        $this->allocations->forProjectUser($projectId, $userId)
            ->each(function (ProjectAllocation $allocation) use ($projectId, $userId) {
                $usedHours = (int) round(
                    $this->allocations->sumUsedHours(
                        $projectId,
                        $userId,
                        $allocation->start_date->toDateString(),
                        $allocation->end_date->toDateString(),
                    )
                );

                $this->allocations->update($allocation, [
                    'used_hours' => $usedHours,
                ]);
            });
    }

    private function syncTeamMemberAllocation(
        Project $project,
        int $userId,
        int $percentage,
        ?int $weeklyCapacityHours = null,
    ): void
    {
        [$startDate, $endDate] = $this->resolveProjectWindow($project);

        $existingAllocations = $this->allocations->forProjectUser($project->id, $userId);

        $allocation = $existingAllocations->first(function (ProjectAllocation $allocation) use ($startDate, $endDate) {
            return $allocation->start_date?->toDateString() === $startDate
                && $allocation->end_date?->toDateString() === $endDate;
        });

        if (! $allocation && $existingAllocations->count() === 1) {
            $allocation = $existingAllocations->first();
        }

        $weeklyCapacityHours ??= $this->resolveUserWeeklyCapacity($userId);

        $payload = [
            'allocated_hours' => $this->calculateAllocatedHours(
                $percentage,
                $weeklyCapacityHours,
                $startDate,
                $endDate,
            ),
            'percentage' => $percentage,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];

        if ($allocation) {
            $this->allocations->update($allocation, $payload);
        } else {
            $allocation = $this->allocations->create([
                'project_id' => $project->id,
                'user_id' => $userId,
                'used_hours' => 0,
                'notes' => null,
                ...$payload,
            ]);
        }

        $this->allocations->deleteDuplicateAllocations($project->id, $userId, $allocation->id);

        $this->syncUsedHoursForProjectUser($project->id, $userId);
    }

    private function resolveProjectWindow(Project $project): array
    {
        $startDate = $project->start_date?->toDateString() ?? now()->toDateString();
        $endDate = $project->end_date?->toDateString() ?? $startDate;

        if ($endDate < $startDate) {
            $endDate = $startDate;
        }

        return [$startDate, $endDate];
    }

    private function resolveUserWeeklyCapacity(int $userId): int
    {
        return $this->capacityReader->getWeeklyCapacityForUser($userId) ?? 40;
    }

    private function calculateAllocatedHours(
        int $percentage,
        int $weeklyCapacityHours,
        string $startDate,
        string $endDate,
    ): int {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->startOfDay();
        $overlapDays = max(1, $start->diffInDays($end->copy()->addDay()));

        return (int) round(($percentage / 100) * $weeklyCapacityHours * ($overlapDays / 7));
    }
}
