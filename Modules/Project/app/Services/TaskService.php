<?php

namespace Modules\Project\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Project\Contracts\ActivityLogServiceInterface;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Contracts\Repositories\TaskRepositoryInterface;
use Modules\Project\Contracts\TaskServiceInterface;
use Modules\Project\Models\Task;

class TaskService implements TaskServiceInterface
{
    /**
     * Create a new task service instance.
     */
    public function __construct(
        protected ActivityLogServiceInterface $activityLog,
        protected NotificationServiceInterface $notificationService,
        protected TaskRepositoryInterface $tasks,
    ) {}

    /**
     * Detect changes between the task and new payload.
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
     * Get all tasks for a project.
     */
    public function getAllTasks(int $projectId): Collection
    {
        return $this->tasks->forProject($projectId);
    }

    /**
     * Get a task by its identifier.
     */
    public function getTaskById(int $taskId): ?Task
    {
        return $this->tasks->findWithDetails($taskId);
    }

    /**
     * Create a new task for the given project.
     */
    public function createTask(int $projectId, array $data): Task
    {
        Log::info('Creating task', ['project_id' => $projectId, 'title' => $data['title']]);

        return DB::transaction(function () use ($projectId, $data) {
            $task = $this->tasks->create([
                'project_id' => $projectId,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'] ?? 'medium',
                'status' => 'todo',
                'estimated_hours' => $data['estimated_hours'] ?? 0,
                'due_date' => $data['due_date'] ?? null,
            ]);

            if (! empty($data['assigned_users'])) {
                $this->tasks->syncAssignedUsers($task, $data['assigned_users']);

                if (auth()->check()) {
                    $this->notificationService->notifyTaskAssigned($task, $data['assigned_users'], auth()->user());
                }
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
     * Update an existing task.
     */
    public function updateTask(int $taskId, array $data): Task
    {
        $task = $this->tasks->findOrFail($taskId);

        Log::info('Updating task', ['task_id' => $taskId, 'data' => $data]);

        $changes = $this->detectChanges($task, $data, [
            'title', 'status', 'priority', 'description', 'estimated_hours',
        ]);

        $this->tasks->update($task, [
            'title' => $data['title'] ?? $task->title,
            'description' => $data['description'] ?? $task->description,
            'priority' => $data['priority'] ?? $task->priority,
            'status' => $data['status'] ?? $task->status,
            'estimated_hours' => $data['estimated_hours'] ?? $task->estimated_hours,
        ]);

        if (array_key_exists('assigned_users', $data)) {
            $oldUsers = $this->tasks->assignedUserIds($task);
            $this->tasks->syncAssignedUsers($task, $data['assigned_users']);

            $newUserIds = array_values(array_diff($data['assigned_users'], $oldUsers));
            if (! empty($newUserIds) && auth()->check()) {
                $this->notificationService->notifyTaskAssigned($task, $newUserIds, auth()->user());
            }
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

        return $this->tasks->fresh($task, ['project', 'assignedUsers']);
    }

    /**
     * Delete an existing task.
     */
    public function deleteTask(int $taskId): bool
    {
        $task = $this->tasks->findOrFail($taskId);

        Log::info('Deleting task', ['task_id' => $taskId, 'title' => $task->title]);

        $this->activityLog->log(
            $task->project_id,
            'task_deleted',
            "Odstránil úlohu: {$task->title}",
            null,
            ['task_title' => $task->title]
        );

        return $this->tasks->delete($task);
    }

    /**
     * Assign users to a task.
     */
    public function assignTask(int $taskId, array $userIds): Task
    {
        Log::info('Assigning users to task', ['task_id' => $taskId, 'user_ids' => $userIds]);

        $task = $this->tasks->findOrFail($taskId);
        $oldUsers = $this->tasks->assignedUserIds($task);
        $this->tasks->syncAssignedUsers($task, $userIds);

        $this->activityLog->log(
            $task->project_id,
            'task_assigned',
            "Zmenil priradenie úlohy: {$task->title}",
            $task,
            ['old_users' => $oldUsers, 'new_users' => $userIds]
        );

        $newUserIds = array_values(array_diff($userIds, $oldUsers));
        if (! empty($newUserIds) && auth()->check()) {
            $this->notificationService->notifyTaskAssigned($task, $newUserIds, auth()->user());
        }

        return $this->tasks->fresh($task, ['assignedUsers']);
    }

    /**
     * Update the status of a task.
     *
     * @return array{task: Task, blocked_by?: array<int, array{id:int, title:string, status:string}>}
     */
    public function updateTaskStatus(int $taskId, string $status, bool $force = false): array
    {
        $task = $this->tasks->findWithPredecessors($taskId);
        $oldStatus = $task->status;

        Log::info('Updating task status', ['task_id' => $taskId, 'old_status' => $oldStatus, 'new_status' => $status, 'force' => $force]);

        $blockingPredecessors = collect();
        if ($status !== 'todo' && $oldStatus === 'todo') {
            $blockingPredecessors = $task->blockingPredecessors();

            if ($blockingPredecessors->isNotEmpty() && ! $force) {
                return [
                    'task' => $task,
                    'blocked_by' => $blockingPredecessors->map(fn (Task $p) => [
                        'id' => $p->id,
                        'title' => $p->title,
                        'status' => $p->status,
                    ])->all(),
                ];
            }
        }

        $this->tasks->update($task, ['status' => $status]);

        $this->activityLog->log(
            $task->project_id,
            'task_status_changed',
            "Zmenil stav úlohy: {$task->title}",
            $task,
            [
                'old_status' => $oldStatus,
                'new_status' => $status,
                'forced' => $force && $blockingPredecessors->isNotEmpty(),
            ]
        );

        $this->notificationService->notifyTaskStatusChanged($task, $oldStatus, $status);

        return ['task' => $this->tasks->fresh($task)];
    }

    /**
     * Get all tasks assigned to a user.
     */
    public function getTasksByUser(int $userId): Collection
    {
        return $this->tasks->byUser($userId);
    }

    /**
     * Estimate task hours using AI.
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
        $this->tasks->incrementActualHours($task, $hours);

        return $this->tasks->fresh($task);
    }
}
