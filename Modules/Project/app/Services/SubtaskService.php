<?php

namespace Modules\Project\Services;

use Illuminate\Support\Facades\Log;
use Modules\Project\Contracts\SubtaskServiceInterface;
use Modules\Project\Models\Subtask;
use Modules\Project\Models\Task;

class SubtaskService implements SubtaskServiceInterface
{
    /**
     * Create a new subtask
     */
    public function createSubtask(int $taskId, array $data): Subtask
    {
        $task = Task::findOrFail($taskId);

        $maxOrder = $task->subtasks()->max('sort_order') ?? 0;

        Log::info('Creating subtask', ['task_id' => $taskId, 'title' => $data['title']]);

        return Subtask::create([
            'task_id' => $taskId,
            'title' => $data['title'],
            'sort_order' => $maxOrder + 1,
        ]);
    }

    /**
     * Update a subtask
     */
    public function updateSubtask(int $subtaskId, array $data): Subtask
    {
        $subtask = Subtask::findOrFail($subtaskId);

        Log::info('Updating subtask', ['subtask_id' => $subtaskId, 'data' => $data]);

        $subtask->update($data);

        return $subtask->fresh();
    }

    /**
     * Toggle subtask completion
     */
    public function toggleSubtask(int $subtaskId): Subtask
    {
        $subtask = Subtask::findOrFail($subtaskId);

        Log::info('Toggling subtask', [
            'subtask_id' => $subtaskId,
            'was_completed' => $subtask->is_completed,
        ]);

        $subtask->toggleComplete();

        return $subtask->fresh();
    }

    /**
     * Delete a subtask
     */
    public function deleteSubtask(int $subtaskId): bool
    {
        $subtask = Subtask::findOrFail($subtaskId);

        Log::info('Deleting subtask', ['subtask_id' => $subtaskId, 'title' => $subtask->title]);

        return $subtask->delete();
    }
}
