<?php

namespace Modules\Project\Contracts\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Project\Models\ActivityLog;

interface ActivityLogRepositoryInterface
{
    public function create(array $data): ActivityLog;

    public function forProject(int $projectId, int $limit = 50): Collection;
}
