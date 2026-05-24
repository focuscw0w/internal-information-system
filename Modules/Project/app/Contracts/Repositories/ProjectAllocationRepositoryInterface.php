<?php

namespace Modules\Project\Contracts\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Project\Models\ProjectAllocation;

interface ProjectAllocationRepositoryInterface
{
    public function deleteForProject(int $projectId): int;

    public function deleteExceptUsers(int $projectId, array $userIds): int;

    public function deleteForProjectUsers(int $projectId, array $userIds): int;

    public function forProjectUser(int $projectId, int $userId): Collection;

    public function create(array $data): ProjectAllocation;

    public function update(ProjectAllocation $allocation, array $data): bool;

    public function deleteDuplicateAllocations(int $projectId, int $userId, int $keepAllocationId): int;

    public function sumUsedHours(int $projectId, int $userId, string $startDate, string $endDate): float;
}
