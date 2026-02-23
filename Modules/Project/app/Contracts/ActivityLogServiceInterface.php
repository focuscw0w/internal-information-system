<?php

namespace Modules\Project\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Modules\Project\Models\ActivityLog;

interface ActivityLogServiceInterface
{
    public function log(
        int    $projectId,
        string $type,
        string $description,
        ?Model $subject = null,
        ?array $metadata = null
    ): ActivityLog;

    public function getProjectActivities(int $projectId, int $limit = 50): Collection;
}

