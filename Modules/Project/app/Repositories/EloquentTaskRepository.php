<?php

namespace Modules\Project\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Project\Contracts\Repositories\TaskRepositoryInterface;
use Modules\Project\Models\Task;

class EloquentTaskRepository implements TaskRepositoryInterface
{
    public function forProject(int $projectId): Collection
    {
        return Task::where('project_id', $projectId)
            ->with(['assignedUsers'])
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function findWithDetails(int $taskId): Task
    {
        return Task::with(['project', 'assignedUsers', 'subtasks'])->findOrFail($taskId);
    }

    public function findWithPredecessors(int $taskId): Task
    {
        return Task::with('predecessors')->findOrFail($taskId);
    }

    public function findOrFail(int $taskId): Task
    {
        return Task::findOrFail($taskId);
    }

    public function create(array $data): Task
    {
        return Task::create($data);
    }

    public function update(Task $task, array $data): bool
    {
        return $task->update($data);
    }

    public function delete(Task $task): bool
    {
        return (bool) $task->delete();
    }

    public function fresh(Task $task, array $relations = []): Task
    {
        return $task->fresh($relations);
    }

    public function assignedUserIds(Task $task): array
    {
        return $task->assignedUsers()->pluck('users.id')->toArray();
    }

    public function syncAssignedUsers(Task $task, array $userIds): void
    {
        $task->assignedUsers()->sync($userIds);
    }

    public function byUser(int $userId): Collection
    {
        return Task::whereHas('assignedUsers', function ($query) use ($userId) {
            $query->where('users.id', $userId);
        })
            ->with(['project'])
            ->orderBy('priority', 'desc')
            ->get();
    }

    public function incrementActualHours(Task $task, float $hours): void
    {
        $task->increment('actual_hours', $hours);
    }

    public function staleInProgressTasks(): Collection
    {
        return Task::whereIn('status', ['in_progress', 'testing'])
            ->where('updated_at', '<', now()->subDays(7))
            ->with(['assignedUsers', 'project.owner'])
            ->get();
    }

    public function todoTasksDueWithin(int $days): Collection
    {
        return Task::where('status', 'todo')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '>=', now()->toDateString())
            ->whereDate('due_date', '<=', now()->addDays($days)->toDateString())
            ->with(['assignedUsers', 'project.owner'])
            ->get();
    }

    public function overdueIncompleteTasks(): Collection
    {
        return Task::where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', now()->toDateString())
            ->with(['assignedUsers', 'project.owner'])
            ->get();
    }

    public function dueIncompleteAssignedTasks(string $date): Collection
    {
        return Task::whereDate('due_date', $date)
            ->where('status', '!=', 'done')
            ->with(['assignedUsers', 'project.owner'])
            ->has('assignedUsers')
            ->get();
    }

    public function countForProject(int $projectId): int
    {
        return Task::where('project_id', $projectId)->count();
    }

    public function countSameProjectTasks(array $taskIds, int $projectId): int
    {
        return Task::whereIn('id', $taskIds)
            ->where('project_id', $projectId)
            ->count();
    }

    public function searchWithinProjects(array $projectIds, string $like, int $limit): Collection
    {
        return Task::query()
            ->whereIn('project_id', $projectIds)
            ->where(function ($q) use ($like) {
                $q->where('title', 'like', $like)
                    ->orWhere('description', 'like', $like);
            })
            ->with('project:id,name')
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get(['id', 'project_id', 'title', 'status']);
    }
}
