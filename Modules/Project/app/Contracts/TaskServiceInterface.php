<?php

namespace Modules\Projects\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\Projects\Entities\Task;

interface TaskServiceInterface
{
    public function getAllTasks(int $projectId): Collection;

    public function getTaskById(int $taskId): ?Task;

    public function createTask(int $projectId, array $data): Task;

    public function updateTask(int $taskId, array $data): Task;

    public function deleteTask(int $taskId): bool;

    public function assignTask(int $taskId, int $userId): Task;

    public function updateTaskStatus(int $taskId, string $status): Task;

    public function getTasksByUser(int $userId): Collection;

    public function estimateTaskWithAI(string $title, string $description): float;
}
