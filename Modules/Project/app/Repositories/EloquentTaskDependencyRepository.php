<?php

namespace Modules\Project\Repositories;

use Illuminate\Support\Facades\DB;
use Modules\Project\Contracts\Repositories\TaskDependencyRepositoryInterface;
use Modules\Project\Models\Task;

class EloquentTaskDependencyRepository implements TaskDependencyRepositoryInterface
{
    public function findTaskOrFail(int $taskId): Task
    {
        return Task::findOrFail($taskId);
    }

    public function countSameProjectTasks(array $taskIds, int $projectId): int
    {
        return Task::whereIn('id', $taskIds)
            ->where('project_id', $projectId)
            ->count();
    }

    public function countProjectTasks(int $projectId): int
    {
        return Task::where('project_id', $projectId)->count();
    }

    public function upstreamTaskIds(int $taskId): array
    {
        return DB::table('task_dependencies')
            ->where('task_id', $taskId)
            ->pluck('depends_on_task_id')
            ->all();
    }

    public function predecessorIds(Task $task): array
    {
        return $task->predecessors()->pluck('tasks.id')->all();
    }

    public function syncPredecessors(Task $task, array $predecessorIds): void
    {
        $task->predecessors()->sync($predecessorIds);
    }

    public function attachPredecessor(Task $task, int $predecessorId): void
    {
        $task->predecessors()->syncWithoutDetaching([$predecessorId]);
    }

    public function detachPredecessor(Task $task, int $predecessorId): void
    {
        $task->predecessors()->detach($predecessorId);
    }
}
