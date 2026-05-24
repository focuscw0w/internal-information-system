<?php

namespace Modules\Project\Services;

use Illuminate\Support\Facades\Log;
use Modules\Project\Contracts\Repositories\SubtaskRepositoryInterface;
use Modules\Project\Contracts\SubtaskServiceInterface;
use Modules\Project\Models\Subtask;

class SubtaskService implements SubtaskServiceInterface
{
    public function __construct(private readonly SubtaskRepositoryInterface $subtasks) {}

    /**
     * Create a new subtask.
     */
    public function createSubtask(int $taskId, array $data): Subtask
    {
        $maxOrder = $this->subtasks->maxSortOrderForTask($taskId);

        Log::info('Creating subtask', ['task_id' => $taskId, 'title' => $data['title']]);

        return $this->subtasks->create([
            'task_id' => $taskId,
            'title' => $data['title'],
            'sort_order' => $maxOrder + 1,
        ]);
    }

    /**
     * Update a subtask.
     */
    public function updateSubtask(int $subtaskId, array $data): Subtask
    {
        $subtask = $this->subtasks->findOrFail($subtaskId);

        Log::info('Updating subtask', ['subtask_id' => $subtaskId, 'data' => $data]);

        $this->subtasks->update($subtask, $data);

        return $this->subtasks->fresh($subtask);
    }

    /**
     * Toggle subtask completion.
     */
    public function toggleSubtask(int $subtaskId): Subtask
    {
        $subtask = $this->subtasks->findOrFail($subtaskId);

        Log::info('Toggling subtask', [
            'subtask_id' => $subtaskId,
            'was_completed' => $subtask->is_completed,
        ]);

        $subtask->toggleComplete();

        return $this->subtasks->fresh($subtask);
    }

    /**
     * Delete a subtask.
     */
    public function deleteSubtask(int $subtaskId): bool
    {
        $subtask = $this->subtasks->findOrFail($subtaskId);

        Log::info('Deleting subtask', ['subtask_id' => $subtaskId, 'title' => $subtask->title]);

        return $this->subtasks->delete($subtask);
    }
}
