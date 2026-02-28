<?php

namespace Modules\Project\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Project\Contracts\ActivityLogServiceInterface;
use Modules\Project\Contracts\TaskServiceInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;

class TaskService implements TaskServiceInterface
{
    public function __construct(
        protected ActivityLogServiceInterface $activityLog
    ) {}

    /**
     * Detect changes between model and new data
     */
    private function detectChanges(Task $task, array $data, array $fields): array
    {
        $changes = [];

        foreach ($fields as $field) {
            if (array_key_exists($field, $data) && $data[$field] !== $task->{$field}) {
                $changes[$field] = [
                    'old' => $task->{$field},
                    'new' => $data[$field],
                ];
            }
        }

        return $changes;
    }

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
        return Task::with(['project', 'assignedUsers', 'subtasks'])
            ->findOrFail($taskId);
    }

    /**
     * Create new task-detail
     */
    public function createTask(int $projectId, array $data): Task
    {
        Log::info('Creating task', ['project_id' => $projectId, 'title' => $data['title']]);

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

            if (! empty($data['assigned_users'])) {
                $task->assignedUsers()->sync($data['assigned_users']);
            }

            $this->activityLog->log(
                $projectId,
                'task_created',
                "Vytvoril úlohu: {$task->title}",
                $task
            );

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

        $changes = $this->detectChanges($task, $data, [
            'title', 'status', 'priority', 'description', 'estimated_hours',
        ]);

        $task->update([
            'title' => $data['title'] ?? $task->title,
            'description' => $data['description'] ?? $task->description,
            'priority' => $data['priority'] ?? $task->priority,
            'status' => $data['status'] ?? $task->status,
            'estimated_hours' => $data['estimated_hours'] ?? $task->estimated_hours,
        ]);

        if (array_key_exists('assigned_users', $data)) {
            $task->assignedUsers()->sync($data['assigned_users']);
        }

        if (! empty($changes)) {
            $this->activityLog->log(
                $task->project_id,
                'task_updated',
                "Aktualizoval úlohu: {$task->title}",
                $task,
                ['changes' => $changes]
            );
        }

        return $task->fresh(['project', 'assignedUsers']);
    }

    /**
     * Delete task-detail
     */
    public function deleteTask(int $taskId): bool
    {
        $task = Task::findOrFail($taskId);

        Log::info('Deleting task', ['task_id' => $taskId, 'title' => $task->title]);

        $this->activityLog->log(
            $task->project_id,
            'task_deleted',
            "Odstránil úlohu: {$task->title}",
            null,
            ['task_title' => $task->title]
        );

        return $task->delete();
    }

    /**
     * Assign task-detail to user
     */
    public function assignTask(int $taskId, array $userIds): Task
    {
        Log::info('Assigning users to task', ['task_id' => $taskId, 'user_ids' => $userIds]);

        $task = Task::findOrFail($taskId);
        $oldUsers = $task->assignedUsers->pluck('id')->toArray();
        $task->assignedUsers()->sync($userIds);

        $this->activityLog->log(
            $task->project_id,
            'task_assigned',
            "Zmenil priradenie úlohy: {$task->title}",
            $task,
            ['old_users' => $oldUsers, 'new_users' => $userIds]
        );

        return $task->fresh(['assignedUsers']);
    }

    /**
     * Update task-detail status
     */
    public function updateTaskStatus(int $taskId, string $status): Task
    {
        $task = Task::findOrFail($taskId);
        $oldStatus = $task->status;

        Log::info('Updating task status', ['task_id' => $taskId, 'old_status' => $oldStatus, 'new_status' => $status]);

        $task->update(['status' => $status]);

        $this->activityLog->log(
            $task->project_id,
            'task_status_changed',
            "Zmenil stav úlohy: {$task->title}",
            $task,
            ['old_status' => $oldStatus, 'new_status' => $status]
        );

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

    /**
     * Log worked hours to a task by incrementing actual_hours.
     */
    public function logHours(int $taskId, float $hours): Task
    {
        $task = $this->getTaskById($taskId);
        $task->increment('actual_hours', $hours);

        return $task->fresh();
    }
}
