<?php

namespace Modules\Project\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Project\Contracts\Repositories\ActivityLogRepositoryInterface;
use Modules\Project\Models\ActivityLog;

class EloquentActivityLogRepository implements ActivityLogRepositoryInterface
{
    public function create(array $data): ActivityLog
    {
        return ActivityLog::create($data);
    }

    public function forProject(int $projectId, int $limit = 50): Collection
    {
        return ActivityLog::where('project_id', $projectId)
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->limit($limit)
            ->get();
    }
}
