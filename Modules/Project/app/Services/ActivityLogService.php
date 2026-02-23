<?php

namespace Modules\Project\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Modules\Project\Contracts\ActivityLogServiceInterface;
use Modules\Project\Models\ActivityLog;

class ActivityLogService implements ActivityLogServiceInterface
{
    /**
     * Log an activity
     */
    public function log(
        int $projectId,
        string $type,
        string $description,
        ?Model $subject = null,
        ?array $metadata = null
    ): ActivityLog {
        return ActivityLog::create([
            'project_id' => $projectId,
            'user_id' => auth()->id(),
            'type' => $type,
            'description' => $description,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject?->id,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Get activities for a project
     */
    public function getProjectActivities(int $projectId, int $limit = 50): Collection
    {
        return ActivityLog::where('project_id', $projectId)
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->limit($limit)
            ->get();
    }
}
