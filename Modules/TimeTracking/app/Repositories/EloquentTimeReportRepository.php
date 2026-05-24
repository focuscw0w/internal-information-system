<?php

namespace Modules\TimeTracking\Repositories;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Modules\TimeTracking\Contracts\Repositories\TimeReportRepositoryInterface;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;

class EloquentTimeReportRepository implements TimeReportRepositoryInterface
{
    public function userStats(Carbon $from, Carbon $to, ?array $userIds, ?array $projectIds, string $status): Collection
    {
        return $this->baseEntriesQuery($from, $to, $userIds, $projectIds, $status)
            ->selectRaw('user_id, COUNT(*) as entries_count, COUNT(DISTINCT project_id) as projects_count')
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');
    }

    public function projectStats(Carbon $from, Carbon $to, ?array $userIds, ?array $projectIds, string $status): Collection
    {
        return $this->baseEntriesQuery($from, $to, $userIds, $projectIds, $status)
            ->selectRaw('project_id, COUNT(*) as entries_count')
            ->groupBy('project_id')
            ->get()
            ->keyBy('project_id');
    }

    public function topContributors(Carbon $from, Carbon $to, ?array $userIds, ?array $projectIds, string $status): Collection
    {
        return $this->baseEntriesQuery($from, $to, $userIds, $projectIds, $status)
            ->selectRaw('project_id, user_id, COALESCE(SUM(hours), 0) as total_hours')
            ->with('user:id,name')
            ->groupBy('project_id', 'user_id')
            ->orderByDesc('total_hours')
            ->get()
            ->groupBy('project_id')
            ->map(fn ($rows) => $rows->take(5)->map(fn ($row) => [
                'user_id' => (int) $row->user_id,
                'name' => $row->user?->name ?? 'Používateľ #'.$row->user_id,
                'hours' => (float) $row->total_hours,
            ])->values());
    }

    public function timelineEntries(Carbon $from, Carbon $to, ?array $userIds, ?array $projectIds, string $status): Collection
    {
        return $this->baseEntriesQuery($from, $to, $userIds, $projectIds, $status)
            ->get(['entry_date', 'hours']);
    }

    public function summaryExportEntries(Carbon $from, Carbon $to, ?array $userIds, ?array $projectIds, string $status): Collection
    {
        return $this->baseEntriesQuery($from, $to, $userIds, $projectIds, $status)
            ->with(['user:id,name,email', 'project:id,name'])
            ->get(['id', 'project_id', 'user_id', 'hours', 'status']);
    }

    public function detailExportEntries(Carbon $from, Carbon $to, ?array $userIds, ?array $projectIds, string $status): Collection
    {
        return $this->baseEntriesQuery($from, $to, $userIds, $projectIds, $status)
            ->with([
                'user:id,name,email',
                'project:id,name',
                'task:id,title',
                'approver:id,name',
            ])
            ->orderBy('entry_date')
            ->orderBy('project_id')
            ->orderBy('user_id')
            ->get();
    }

    public function usersByIds(array $userIds): Collection
    {
        return User::query()
            ->whereIn('id', array_map('intval', $userIds))
            ->get(['id', 'name', 'email'])
            ->keyBy('id');
    }

    public function filterUsers(?array $projectIds): Collection
    {
        return User::query()
            ->whereIn('id', TimeEntry::query()
                ->when($projectIds !== null, fn ($query) => $query->whereIn('project_id', $projectIds))
                ->select('user_id')
                ->distinct())
            ->orderBy('name')
            ->get(['id', 'name', 'email']);
    }

    private function baseEntriesQuery(Carbon $from, Carbon $to, ?array $userIds, ?array $projectIds, string $status): Builder
    {
        return TimeEntry::query()
            ->whereDate('entry_date', '>=', $from)
            ->whereDate('entry_date', '<=', $to)
            ->when($userIds !== null, fn ($query) => $query->whereIn('user_id', $userIds))
            ->when($projectIds !== null, fn ($query) => $query->whereIn('project_id', $projectIds))
            ->when($status !== 'all', fn ($query) => $query->where('status', $status));
    }
}
