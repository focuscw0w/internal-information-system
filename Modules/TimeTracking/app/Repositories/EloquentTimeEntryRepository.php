<?php

namespace Modules\TimeTracking\Repositories;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Modules\TimeTracking\Contracts\Repositories\TimeEntryRepositoryInterface;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;

class EloquentTimeEntryRepository implements TimeEntryRepositoryInterface
{
    public function getByProject(int $projectId, array $filters = []): Collection
    {
        $query = TimeEntry::with(['task', 'user'])
            ->where('project_id', $projectId)
            ->orderByDesc('entry_date');

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['task_id'])) {
            $query->where('task_id', $filters['task_id']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('entry_date', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('entry_date', '<=', $filters['date_to']);
        }

        return $query->get();
    }

    public function getByTask(int $taskId): Collection
    {
        return TimeEntry::with(['user'])
            ->where('task_id', $taskId)
            ->orderByDesc('entry_date')
            ->get();
    }

    public function create(array $data): TimeEntry
    {
        return TimeEntry::create($data);
    }

    public function find(int $id): ?TimeEntry
    {
        return TimeEntry::find($id);
    }

    public function findOrFail(int $id): TimeEntry
    {
        return TimeEntry::findOrFail($id);
    }

    public function findWithProjectOrFail(int $id): TimeEntry
    {
        return TimeEntry::with('project')->findOrFail($id);
    }

    public function findManyWithProject(array $ids): Collection
    {
        return TimeEntry::with('project')
            ->whereIn('id', array_map('intval', $ids))
            ->get();
    }

    public function update(TimeEntry $entry, array $data): bool
    {
        return $entry->update($data);
    }

    public function delete(TimeEntry $entry): bool
    {
        return (bool) $entry->delete();
    }

    public function updateStatusForIds(array $ids, array $data): int
    {
        return TimeEntry::query()
            ->whereIn('id', array_map('intval', $ids))
            ->update($data);
    }

    public function totalHoursForTask(int $taskId): float
    {
        return round((float) TimeEntry::where('task_id', $taskId)->sum('hours'), 2);
    }

    public function totalHoursPerUserInPeriod(
        Carbon $from,
        Carbon $to,
        ?array $userIds = null,
        ?array $projectIds = null,
        string $status = 'all',
    ): Collection {
        return $this->filteredPeriodQuery($from, $to, $userIds, $projectIds, $status)
            ->selectRaw('user_id, COALESCE(SUM(hours), 0) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id');
    }

    public function totalHoursPerProjectInPeriod(
        Carbon $from,
        Carbon $to,
        ?array $userIds = null,
        ?array $projectIds = null,
        string $status = 'approved',
    ): Collection {
        return $this->filteredPeriodQuery($from, $to, $userIds, $projectIds, $status)
            ->selectRaw('project_id, COALESCE(SUM(hours), 0) as total')
            ->groupBy('project_id')
            ->pluck('total', 'project_id');
    }

    public function hoursGroupedByWeekAndUser(
        Carbon $from,
        Carbon $to,
        ?array $userIds = null,
        ?array $projectIds = null,
        string $status = 'all',
    ): array {
        return $this->filteredPeriodQuery($from, $to, $userIds, $projectIds, $status)
            ->get(['user_id', 'entry_date', 'hours'])
            ->groupBy(fn ($entry) => $entry->entry_date->format('o-W'))
            ->map(fn ($week) => $week
                ->groupBy('user_id')
                ->map(fn ($userEntries) => (float) $userEntries->sum('hours'))
                ->all())
            ->all();
    }

    public function entriesForUser(User $user): Collection
    {
        return TimeEntry::with(['task', 'project', 'user'])
            ->where('user_id', $user->id)
            ->orderByDesc('entry_date')
            ->get();
    }

    public function totalHoursThisWeekForUser(User $user): float
    {
        return (float) TimeEntry::forUser($user->id)->thisWeek()->sum('hours');
    }

    public function totalHoursThisMonthForUser(User $user): float
    {
        return (float) TimeEntry::forUser($user->id)->thisMonth()->sum('hours');
    }

    public function recentEntriesForUser(User $user, int $limit = 5): Collection
    {
        return TimeEntry::forUser($user->id)
            ->with(['task', 'project'])
            ->latest('entry_date')
            ->limit($limit)
            ->get();
    }

    private function filteredPeriodQuery(
        Carbon $from,
        Carbon $to,
        ?array $userIds = null,
        ?array $projectIds = null,
        string $status = 'all',
    ): Builder {
        return TimeEntry::query()
            ->whereDate('entry_date', '>=', $from)
            ->whereDate('entry_date', '<=', $to)
            ->when($userIds !== null, fn ($query) => $query->whereIn('user_id', array_map('intval', $userIds)))
            ->when($projectIds !== null, fn ($query) => $query->whereIn('project_id', array_map('intval', $projectIds)))
            ->when($status !== 'all', fn ($query) => $query->where('status', $status));
    }
}
