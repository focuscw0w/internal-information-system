<?php

namespace Modules\Project\Contracts\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Project\Models\Task;

interface TaskRepositoryInterface
{
    public function forProject(int $projectId): Collection;

    public function findWithDetails(int $taskId): Task;

    public function findWithPredecessors(int $taskId): Task;

    public function findOrFail(int $taskId): Task;

    public function create(array $data): Task;

    public function update(Task $task, array $data): bool;

    public function delete(Task $task): bool;

    public function fresh(Task $task, array $relations = []): Task;

    public function assignedUserIds(Task $task): array;

    public function syncAssignedUsers(Task $task, array $userIds): void;

    public function byUser(int $userId): Collection;

    public function incrementActualHours(Task $task, float $hours): void;

    public function staleInProgressTasks(): Collection;

    public function todoTasksDueWithin(int $days): Collection;

    public function overdueIncompleteTasks(): Collection;

    public function dueIncompleteAssignedTasks(string $date): Collection;

    public function countForProject(int $projectId): int;

    public function countSameProjectTasks(array $taskIds, int $projectId): int;

    public function searchWithinProjects(array $projectIds, string $like, int $limit): Collection;
}
