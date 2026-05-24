<?php

namespace Modules\TimeTracking\Repositories;

use Illuminate\Support\Facades\DB;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Contracts\Repositories\TimeTrackingTaskRepositoryInterface;

class EloquentTimeTrackingTaskRepository implements TimeTrackingTaskRepositoryInterface
{
    public function find(int $id): ?Task
    {
        return Task::find($id);
    }

    public function assignedUserExists(int $taskId, int $userId): bool
    {
        return DB::table('assigned_users')
            ->where('task_id', $taskId)
            ->where('user_id', $userId)
            ->exists();
    }

    public function updateActualHours(int $taskId, float $hours): void
    {
        Task::where('id', $taskId)->update([
            'actual_hours' => $hours,
        ]);
    }

    public function findForHoursExceededCheck(int $taskId): ?Task
    {
        return Task::find($taskId);
    }
}
