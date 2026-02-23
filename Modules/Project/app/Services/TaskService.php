<?php

namespace Modules\Project\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\Project\Contracts\TaskServiceInterface;

class TaskService implements TaskServiceInterface
{
    /**
     * Get all tasks for a project
     */
    public function getAllTasks(int $projectId): Collection
    {
        return Task::where('project_id', $projectId)
            ->with(['assignedUsers'])
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get task-detail by ID
     */
    public function getTaskById(int $taskId): ?Task
    {
        return Task::with(['project', 'assignedUsers'])
            ->findOrFail($taskId);
    }

    /**
     * Create new task-detail
     */
    public function createTask(int $projectId, array $data): Task
    {
        Log::info('Creating task', ['project_id' => $projectId, 'title' => $data['title']]);

        Project::findOrFail($projectId);

        return DB::transaction(function () use ($projectId, $data) {
            $task = Task::create([
                'project_id' => $projectId,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'] ?? 'medium',
                'status' => 'todo',
                'estimated_hours' => $data['estimated_hours'] ?? 0,
                'due_date' => $data['due_date'] ?? null,
            ]);

            return $task->load(['project', 'assignedUsers']);
        });
    }

    /**
     * Update existing task-detail
     */
    public function updateTask(int $taskId, array $data): Task
    {
        $task = Task::findOrFail($taskId);

        Log::info('Updating task', ['task_id' => $taskId, 'data' => $data]);

        $task->update([
            'title' => $data['title'] ?? $task->title,
            'description' => $data['description'] ?? $task->description,
            'priority' => $data['priority'] ?? $task->priority,
            'status' => $data['status'] ?? $task->status,
            'estimated_hours' => $data['estimated_hours'] ?? $task->estimated_hours,
        ]);

        return $task->fresh(['project', 'assignedUsers']);
    }

    /**
     * Delete task-detail
     */
    public function deleteTask(int $taskId): bool
    {
        $task = Task::findOrFail($taskId);

        Log::info('Deleting task', ['task_id' => $taskId, 'title' => $task->title]);

        return $task->delete();
    }

    /**
     * Assign task-detail to user
     */
    public function assignTask(int $taskId, array $userIds): Task
    {
        Log::info('Assigning users to task', ['task_id' => $taskId, 'user_ids' => $userIds]);

        $task = Task::findOrFail($taskId);
        $task->assignedUsers()->sync($userIds);

        return $task->fresh(['assignedUsers']);
    }

    /**
     * Update task-detail status
     */
    public function updateTaskStatus(int $taskId, string $status): Task
    {
        $task = Task::findOrFail($taskId);

        Log::info('Updating task status', ['task_id' => $taskId, 'old_status' => $task->status, 'new_status' => $status]);

        $task->update(['status' => $status]);

        return $task->fresh();
    }

    /**
     * Get all tasks assigned to user
     */
    public function getTasksByUser(int $userId): Collection
    {
        return Task::whereHas('assignedUsers', function ($query) use ($userId) {
            $query->where('users.id', $userId);
        })
            ->with(['project'])
            ->orderBy('priority', 'desc')
            ->get();
    }

    /**
     * Estimate task-detail hours using AI
     */
    public function estimateTaskWithAI(string $title, string $description): float
    {
        // AI implementácia (OpenAI API volanie)
        return 8.0;
    }
}
