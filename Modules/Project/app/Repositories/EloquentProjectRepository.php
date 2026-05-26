<?php

namespace Modules\Project\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Project\Contracts\Repositories\ProjectRepositoryInterface;
use Modules\Project\Models\Project;
use Modules\User\Models\User;

class EloquentProjectRepository implements ProjectRepositoryInterface
{
    public function visibleTo(User $user, array $filters = []): Collection
    {
        $query = Project::with(['owner', 'team'])->visibleTo($user);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (isset($filters['owner_id'])) {
            $query->where('owner_id', $filters['owner_id']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%'.$filters['search'].'%')
                    ->orWhere('description', 'like', '%'.$filters['search'].'%');
            });
        }

        return $query->get();
    }

    public function findWithDetails(int $id): ?Project
    {
        return Project::with(['owner', 'team', 'tasks'])->find($id);
    }

    public function find(int $id): ?Project
    {
        return Project::find($id);
    }

    public function findOrFail(int $id): Project
    {
        return Project::findOrFail($id);
    }

    public function create(array $data): Project
    {
        return Project::create($data);
    }

    public function update(Project $project, array $data): bool
    {
        return $project->update($data);
    }

    public function delete(Project $project): bool
    {
        return (bool) $project->delete();
    }

    public function fresh(Project $project, array $relations = []): Project
    {
        return $project->fresh($relations);
    }

    public function statistics(): array
    {
        $active = Project::active();

        return [
            'total' => Project::count(),
            'active' => Project::where('status', 'active')->count(),
            'planning' => Project::where('status', 'planning')->count(),
            'completed' => Project::where('status', 'completed')->count(),
            'on_hold' => Project::where('status', 'on_hold')->count(),
            'cancelled' => Project::where('status', 'cancelled')->count(),
            'overdue' => $this->overdue()->count(),
            'total_team_members' => (clone $active)
                ->with('team')
                ->get()
                ->pluck('team')
                ->flatten()
                ->unique('id')
                ->count(),
            'average_capacity' => round((float) Project::active()->avg('capacity_used'), 2),
            'completed_tasks' => Project::active()->sum('tasks_completed'),
            'total_tasks' => Project::active()->sum('tasks_total'),
        ];
    }

    public function byStatus(string $status): Collection
    {
        return Project::where('status', $status)
            ->with(['owner', 'team'])
            ->get();
    }

    public function overdue(): Collection
    {
        return Project::where('end_date', '<', now())
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->with(['owner', 'team'])
            ->get();
    }

    public function forUserWithSummaryRelations(int $userId): Collection
    {
        return Project::forUser($userId)
            ->with(['team', 'tasks'])
            ->get();
    }

    public function activeWithIncompleteTasks(): Collection
    {
        return Project::query()
            ->where('status', 'active')
            ->with(['tasks' => fn ($q) => $q->whereNotIn('status', ['done'])
                ->select('id', 'project_id', 'estimated_hours', 'actual_hours'),
            ])
            ->get(['id', 'name', 'end_date']);
    }

    public function allWithTeam(): Collection
    {
        return Project::query()->with('team')->get();
    }

    public function withTeamForUser(int $userId): Collection
    {
        return Project::query()
            ->whereHas('team', fn ($query) => $query->where('users.id', $userId))
            ->with('team')
            ->get();
    }

    public function visibleProjectIds(User $user): array
    {
        return Project::visibleTo($user)->pluck('id')->all();
    }

    public function latestVisibleForTaskActions(User $user, ?string $nameLike, int $limit): Collection
    {
        $query = Project::visibleTo($user)
            ->orderByDesc('updated_at')
            ->limit($limit);

        if ($nameLike !== null) {
            $query->where('name', 'like', $nameLike);
        }

        return $query->get(['id', 'name', 'owner_id', 'updated_at']);
    }

    public function searchVisible(User $user, string $like, int $limit): Collection
    {
        return Project::visibleTo($user)
            ->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('description', 'like', $like);
            })
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get(['id', 'name', 'status']);
    }
}
