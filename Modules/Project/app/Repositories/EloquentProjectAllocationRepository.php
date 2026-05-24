<?php

namespace Modules\Project\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Project\Contracts\Repositories\ProjectAllocationRepositoryInterface;
use Modules\Project\Models\ProjectAllocation;
use Modules\TimeTracking\Models\TimeEntry;

class EloquentProjectAllocationRepository implements ProjectAllocationRepositoryInterface
{
    public function deleteForProject(int $projectId): int
    {
        return ProjectAllocation::query()
            ->where('project_id', $projectId)
            ->delete();
    }

    public function deleteExceptUsers(int $projectId, array $userIds): int
    {
        return ProjectAllocation::query()
            ->where('project_id', $projectId)
            ->whereNotIn('user_id', $userIds)
            ->delete();
    }

    public function deleteForProjectUsers(int $projectId, array $userIds): int
    {
        return ProjectAllocation::query()
            ->where('project_id', $projectId)
            ->whereIn('user_id', $userIds)
            ->delete();
    }

    public function forProjectUser(int $projectId, int $userId): Collection
    {
        return ProjectAllocation::query()
            ->where('project_id', $projectId)
            ->where('user_id', $userId)
            ->orderByDesc('id')
            ->get();
    }

    public function create(array $data): ProjectAllocation
    {
        return ProjectAllocation::query()->create($data);
    }

    public function update(ProjectAllocation $allocation, array $data): bool
    {
        return $allocation->update($data);
    }

    public function deleteDuplicateAllocations(int $projectId, int $userId, int $keepAllocationId): int
    {
        return ProjectAllocation::query()
            ->where('project_id', $projectId)
            ->where('user_id', $userId)
            ->whereKeyNot($keepAllocationId)
            ->delete();
    }

    public function sumUsedHours(int $projectId, int $userId, string $startDate, string $endDate): float
    {
        return (float) TimeEntry::query()
            ->where('project_id', $projectId)
            ->where('user_id', $userId)
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->sum('hours');
    }
}
