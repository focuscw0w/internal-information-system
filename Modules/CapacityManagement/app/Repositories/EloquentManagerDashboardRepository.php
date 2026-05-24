<?php

namespace Modules\CapacityManagement\Repositories;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\CapacityManagement\Contracts\Repositories\ManagerDashboardRepositoryInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;

class EloquentManagerDashboardRepository implements ManagerDashboardRepositoryInterface
{
    public function pendingApprovalCount(?array $projectIds = null): int
    {
        return $this->pendingApprovalQuery($projectIds)->count();
    }

    public function pendingApprovalEntries(?array $projectIds = null, int $limit = 8): Collection
    {
        return $this->pendingApprovalQuery($projectIds)
            ->with(['user:id,name,email', 'project:id,name', 'task:id,title'])
            ->orderBy('entry_date')
            ->limit($limit)
            ->get();
    }

    public function overdueTasks(?array $projectIds = null, int $limit = 6): Collection
    {
        return Task::overdue()
            ->when($projectIds !== null, fn ($query) => $query->whereIn('project_id', $projectIds))
            ->with('project:id,name')
            ->orderBy('due_date')
            ->limit($limit)
            ->get();
    }

    public function atRiskProjects(?array $projectIds = null, int $limit = 6): Collection
    {
        return Project::query()
            ->when($projectIds !== null, fn ($query) => $query->whereIn('id', $projectIds))
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->with(['tasks', 'owner:id,name'])
            ->get()
            ->filter(fn (Project $project) => $project->is_at_risk)
            ->take($limit)
            ->values();
    }

    public function managedProjects(?array $projectIds = null, int $limit = 8): Collection
    {
        return Project::query()
            ->when($projectIds !== null, fn ($query) => $query->whereIn('id', $projectIds))
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->withCount('team')
            ->orderByRaw('CASE WHEN end_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('end_date')
            ->limit($limit)
            ->get();
    }

    public function teamProjects(User $user, bool $includeAll): Collection
    {
        return Project::query()
            ->when(! $includeAll, function ($query) use ($user) {
                $query->where(function ($projectQuery) use ($user) {
                    $projectQuery
                        ->where('owner_id', $user->id)
                        ->orWhereHas('team', function ($teamQuery) use ($user) {
                            $teamQuery
                                ->where('user_id', $user->id)
                                ->where(function ($permissionQuery) {
                                    $permissionQuery
                                        ->whereJsonContains('permissions', 'manage_team')
                                        ->orWhereJsonContains('permissions', 'manage_time_entries');
                                });
                        });
                });
            })
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->with(['owner:id,name,email', 'team:id,name,email', 'allocations'])
            ->orderByRaw('CASE WHEN end_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('end_date')
            ->get();
    }

    public function managedProjectIds(User $user, bool $isAdmin): Collection
    {
        if ($isAdmin) {
            return Project::query()->pluck('id');
        }

        return Project::managedBy($user)->pluck('id');
    }

    public function managedTimeProjectIds(User $user, bool $isAdmin): Collection
    {
        if ($isAdmin) {
            return Project::query()->pluck('id');
        }

        return Project::whereUserCanManageTimeEntries($user)->pluck('id');
    }

    public function viewTimeProjectIds(User $user, bool $isAdmin): Collection
    {
        if ($isAdmin) {
            return Project::query()->pluck('id');
        }

        return Project::query()
            ->where(function ($query) use ($user) {
                $query
                    ->where('owner_id', $user->id)
                    ->orWhereHas('team', fn ($teamQuery) => $teamQuery
                        ->where('user_id', $user->id)
                        ->whereJsonContains('permissions', 'manage_time_entries'));
            })
            ->pluck('id');
    }

    public function allUserIds(): Collection
    {
        return User::query()->pluck('id')->map(fn ($id) => (int) $id)->values();
    }

    public function usersByIds(array $userIds): Collection
    {
        return User::query()
            ->whereIn('id', $userIds)
            ->get(['id', 'name', 'email'])
            ->keyBy('id');
    }

    public function projectHoursByProjectAndUser(array $projectIds, Carbon $from, Carbon $to): Collection
    {
        return TimeEntry::query()
            ->when($projectIds !== [], fn ($query) => $query->whereIn('project_id', $projectIds))
            ->whereDate('entry_date', '>=', $from)
            ->whereDate('entry_date', '<=', $to)
            ->selectRaw('project_id, user_id, COALESCE(SUM(hours), 0) as total')
            ->groupBy('project_id', 'user_id')
            ->get()
            ->groupBy('project_id')
            ->map(fn ($entries) => $entries->pluck('total', 'user_id')->map(fn ($hours) => (float) $hours));
    }

    private function pendingApprovalQuery(?array $projectIds)
    {
        return TimeEntry::pending()
            ->when($projectIds !== null, fn ($query) => $query->whereIn('project_id', $projectIds));
    }
}
