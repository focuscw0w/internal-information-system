<?php

namespace Modules\Project\Repositories;

use Illuminate\Support\Collection;
use Modules\Project\Contracts\Repositories\ProjectTeamRepositoryInterface;
use Modules\Project\Models\Project;

class EloquentProjectTeamRepository implements ProjectTeamRepositoryInterface
{
    public function userIds(Project $project): array
    {
        return $project->team()->pluck('users.id')->toArray();
    }

    public function existingMembers(Project $project, array $userIds): Collection
    {
        return $project->team()
            ->wherePivotIn('user_id', $userIds)
            ->get()
            ->keyBy('id');
    }

    public function sync(Project $project, array $syncData): void
    {
        $project->team()->sync($syncData);
    }

    public function detach(Project $project, int $userId): int
    {
        return $project->team()->detach($userId);
    }
}
