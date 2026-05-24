<?php

namespace Modules\TimeTracking\Repositories;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Modules\Project\Models\Project;
use Modules\TimeTracking\Contracts\Repositories\TimeTrackingProjectRepositoryInterface;
use Modules\User\Models\User;

class EloquentTimeTrackingProjectRepository implements TimeTrackingProjectRepositoryInterface
{
    public function find(int $id): ?Project
    {
        return Project::find($id);
    }

    public function findOrFail(int $id): Project
    {
        return Project::findOrFail($id);
    }

    public function userIsParticipant(int $projectId, User $user): bool
    {
        return (bool) (Project::find($projectId)?->userIsParticipant($user) ?? false);
    }

    public function timerProjectsForUser(int $userId): Collection
    {
        return Project::with([
            'tasks' => fn ($query) => $query
                ->select('id', 'project_id', 'title')
                ->whereHas('assignedUsers', fn ($assignedQuery) => $assignedQuery->where('users.id', $userId)),
        ])
            ->where(function ($query) use ($userId) {
                $query->where('owner_id', $userId)
                    ->orWhereHas('team', fn ($teamQuery) => $teamQuery->where('user_id', $userId));
            })
            ->whereHas('tasks.assignedUsers', fn ($query) => $query->where('users.id', $userId))
            ->get(['id', 'name']);
    }

    public function manageableProjectIds(User $user): array
    {
        return Project::query()
            ->where(function (Builder $query) use ($user) {
                $query
                    ->where('owner_id', $user->id)
                    ->orWhereHas('team', function (Builder $teamQuery) use ($user) {
                        $teamQuery
                            ->where('user_id', $user->id)
                            ->whereJsonContains('permissions', 'manage_time_entries');
                    });
            })
            ->pluck('id')
            ->all();
    }

    public function hasManageableProjects(User $user): bool
    {
        return Project::whereUserCanManageTimeEntries($user)->exists();
    }

    public function reportFilterProjects(?array $projectIds): Collection
    {
        return Project::query()
            ->when($projectIds !== null, fn ($query) => $query->whereIn('id', $projectIds))
            ->orderBy('name')
            ->get(['id', 'name']);
    }
}
