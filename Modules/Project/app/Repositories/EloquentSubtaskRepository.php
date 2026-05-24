<?php

namespace Modules\Project\Repositories;

use Modules\Project\Contracts\Repositories\SubtaskRepositoryInterface;
use Modules\Project\Models\Subtask;
use Modules\Project\Models\Task;

class EloquentSubtaskRepository implements SubtaskRepositoryInterface
{
    public function maxSortOrderForTask(int $taskId): int
    {
        return (int) (Task::findOrFail($taskId)->subtasks()->max('sort_order') ?? 0);
    }

    public function create(array $data): Subtask
    {
        return Subtask::create($data);
    }

    public function findOrFail(int $subtaskId): Subtask
    {
        return Subtask::findOrFail($subtaskId);
    }

    public function update(Subtask $subtask, array $data): bool
    {
        return $subtask->update($data);
    }

    public function delete(Subtask $subtask): bool
    {
        return (bool) $subtask->delete();
    }

    public function fresh(Subtask $subtask): Subtask
    {
        return $subtask->fresh();
    }
}
