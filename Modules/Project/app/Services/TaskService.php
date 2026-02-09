<?php

namespace Modules\Project\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Project\App\Models\Project;
use Modules\Project\App\Models\Task;
use Modules\Project\Contracts\TaskServiceInterface;

class TaskService implements TaskServiceInterface
{
    /**
     * Get all tasks for a project
     */
    public function getAllTasks(int $projectId): Collection
    {
        return Task::where('project_id', $projectId)
            ->with(['assignedUser',])
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get task by ID
     */
    public function getTaskById(int $taskId): ?Task
    {
        return Task::with(['project', 'assignedUser',])
            ->findOrFail($taskId);
    }

    /**
     * Create new task
     */
    public function createTask(int $projectId, array $data): Task
    {
        $project = Project::findOrFail($projectId);

        return DB::transaction(function () use ($projectId, $data) {
            $task = Task::create([
                'project_id' => $projectId,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'] ?? 'medium',
                'status' => 'todo',
                'estimated_hours' => $data['estimated_hours'] ?? 0,
                'assigned_to' => $data['assigned_to'] ?? null,
            ]);

            return $task->load(['project', 'assignedUser']);
        });
    }

    /**
     * Update existing task
     */
    public function updateTask(int $taskId, array $data): Task
    {
        $task = Task::findOrFail($taskId);

        $task->update([
            'title' => $data['title'] ?? $task->title,
            'description' => $data['description'] ?? $task->description,
            'priority' => $data['priority'] ?? $task->priority,
            'status' => $data['status'] ?? $task->status,
            'estimated_hours' => $data['estimated_hours'] ?? $task->estimated_hours,
            'assigned_to' => $data['assigned_to'] ?? $task->assigned_to,
        ]);

        return $task->fresh(['project', 'assignedUser']);
    }

    /**
     * Delete task
     */
    public function deleteTask(int $taskId): bool
    {
        $task = Task::findOrFail($taskId);

        return $task->delete();
    }

    /**
     * Assign task to user
     */
    public function assignTask(int $taskId, int $userId): Task
    {
        $task = Task::findOrFail($taskId);
        $task->update(['assigned_to' => $userId]);

        return $task->fresh(['assignedUser']);
    }

    /**
     * Update task status
     */
    public function updateTaskStatus(int $taskId, string $status): Task
    {
        $task = Task::findOrFail($taskId);
        $task->update(['status' => $status]);

        return $task->fresh();
    }

    /**
     * Get all tasks assigned to user
     */
    public function getTasksByUser(int $userId): Collection
    {
        return Task::where('assigned_to', $userId)
            ->with(['project'])
            ->orderBy('priority', 'desc')
            ->get();
    }

    /**
     * Estimate task hours using AI
     */
    public function estimateTaskWithAI(string $title, string $description): float
    {
        // AI implementácia (OpenAI API volanie)
        return 8.0;
    }
}
