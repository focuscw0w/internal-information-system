<?php

namespace Modules\CapacityManagement\Repositories;

use Illuminate\Support\Collection;
use Modules\CapacityManagement\Contracts\Repositories\CapacityDashboardRepositoryInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;

class EloquentCapacityDashboardRepository implements CapacityDashboardRepositoryInterface
{
    public function tasksDueForUser(User $user, string $today, int $limit = 6): Collection
    {
        return Task::query()
            ->whereHas('assignedUsers', fn ($query) => $query->where('users.id', $user->id))
            ->where('status', '!=', 'done')
            ->whereDate('due_date', '<=', $today)
            ->with('project:id,name')
            ->orderBy('due_date')
            ->limit($limit)
            ->get();
    }

    public function atRiskProjectsForUser(User $user, int $limit = 5): Collection
    {
        return Project::query()
            ->forUser($user->id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->with(['tasks', 'owner:id,name'])
            ->get()
            ->filter(fn (Project $project) => $project->is_at_risk || $project->is_overdue)
            ->sortBy([
                ['is_overdue', 'desc'],
                ['days_remaining', 'asc'],
            ])
            ->take($limit)
            ->values();
    }

    public function weekTimeEntryStatsForUser(int $userId, string $weekStart, string $today): array
    {
        $weekEntries = TimeEntry::query()
            ->forUser($userId)
            ->whereDate('entry_date', '>=', $weekStart)
            ->whereDate('entry_date', '<=', $today);

        return [
            'logged_hours' => (float) (clone $weekEntries)->sum('hours'),
            'today_hours' => (float) (clone $weekEntries)->whereDate('entry_date', $today)->sum('hours'),
            'entries_count' => (clone $weekEntries)->count(),
        ];
    }
}
