<?php

namespace Modules\Project\Contracts\Repositories;

use Modules\Project\Models\Task;

interface TaskDependencyRepositoryInterface
{
    public function findTaskOrFail(int $taskId): Task;

    public function countSameProjectTasks(array $taskIds, int $projectId): int;

    public function countProjectTasks(int $projectId): int;

    public function upstreamTaskIds(int $taskId): array;

    public function predecessorIds(Task $task): array;

    public function syncPredecessors(Task $task, array $predecessorIds): void;

    public function attachPredecessor(Task $task, int $predecessorId): void;

    public function detachPredecessor(Task $task, int $predecessorId): void;
}
