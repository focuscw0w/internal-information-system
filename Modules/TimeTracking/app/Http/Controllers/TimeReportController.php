<?php

namespace Modules\TimeTracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Project\Models\Project;
use Modules\TimeTracking\Enums\TimeEntryStatusEnum;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\TimeTracking\Services\TimeEntryService;
use Modules\User\Models\User;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TimeReportController extends Controller
{
    public function __construct(private readonly TimeEntryService $timeEntryService) {}

    public function index(Request $request): Response
    {
        $filters = $this->normalizedFilters($request);

        return Inertia::render('TimeTracking/manager/Reports', [
            'filters' => $filters,
            'data' => $this->buildDataset($request, $filters),
            'filterOptions' => $this->filterOptions($request),
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $filters = $this->normalizedFilters($request);

        return response()->json($this->buildDataset($request, $filters));
    }

    public function export(Request $request): StreamedResponse
    {
        $filters = $this->normalizedFilters($request);
        $dataset = $this->buildDataset($request, $filters);
        $tab = $request->string('tab', 'users')->toString();
        $filename = 'time-report-'.$tab.'-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($dataset, $tab) {
            echo "\xEF\xBB\xBF";
            $handle = fopen('php://output', 'w');

            if ($tab === 'projects') {
                fputcsv($handle, ['Projekt', 'Hodiny', 'Počet záznamov', 'Top prispievatelia']);
                foreach ($dataset['byProject'] as $row) {
                    fputcsv($handle, [
                        $row['project_name'],
                        $row['total_hours'],
                        $row['entries_count'],
                        collect($row['top_contributors'])->pluck('name')->join(', '),
                    ]);
                }
            } elseif ($tab === 'timeline') {
                fputcsv($handle, ['Obdobie', 'Hodiny', 'Počet záznamov']);
                foreach ($dataset['timeline'] as $row) {
                    fputcsv($handle, [$row['label'], $row['total_hours'], $row['entries_count']]);
                }
            } else {
                fputcsv($handle, ['Osoba', 'Hodiny', 'Počet záznamov', 'Počet projektov']);
                foreach ($dataset['byUser'] as $row) {
                    fputcsv($handle, [
                        $row['user_name'],
                        $row['total_hours'],
                        $row['entries_count'],
                        $row['projects_count'],
                    ]);
                }
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function buildDataset(Request $request, array $filters): array
    {
        $from = Carbon::parse($filters['date_from'])->startOfDay();
        $to = Carbon::parse($filters['date_to'])->endOfDay();
        $projectScope = $this->scopedProjectIds($request);
        $projectIds = $this->intersectIds($projectScope, $filters['project_ids']);
        $userIds = $filters['user_ids'] ?: null;
        $status = $filters['status'];

        $totalsByUser = $this->timeEntryService
            ->getTotalHoursPerUserInPeriod($from, $to, $userIds, $projectIds, $status);
        $totalsByProject = $this->timeEntryService
            ->getTotalHoursPerProjectInPeriod($from, $to, $userIds, $projectIds, $status);

        $base = $this->baseEntriesQuery($from, $to, $userIds, $projectIds, $status);

        $users = User::query()
            ->whereIn('id', $totalsByUser->keys()->all())
            ->get(['id', 'name', 'email'])
            ->keyBy('id');
        $projects = Project::query()
            ->whereIn('id', $totalsByProject->keys()->all())
            ->get(['id', 'name'])
            ->keyBy('id');

        $byUserStats = (clone $base)
            ->selectRaw('user_id, COUNT(*) as entries_count, COUNT(DISTINCT project_id) as projects_count')
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');

        $byProjectStats = (clone $base)
            ->selectRaw('project_id, COUNT(*) as entries_count')
            ->groupBy('project_id')
            ->get()
            ->keyBy('project_id');

        $topContributors = (clone $base)
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

        $timelineGranularity = $from->diffInDays($to) > 45 ? 'week' : 'day';
        $timeline = (clone $base)
            ->get(['entry_date', 'hours'])
            ->groupBy(fn (TimeEntry $entry) => $timelineGranularity === 'week'
                ? $entry->entry_date->format('o-W')
                : $entry->entry_date->toDateString())
            ->map(fn ($rows, $label) => [
                'label' => $label,
                'total_hours' => (float) $rows->sum('hours'),
                'entries_count' => $rows->count(),
            ])
            ->sortBy('label')
            ->values();

        return [
            'byUser' => $totalsByUser->map(fn ($hours, $userId) => [
                'user_id' => (int) $userId,
                'user_name' => $users[$userId]->name ?? 'Používateľ #'.$userId,
                'total_hours' => (float) $hours,
                'entries_count' => (int) ($byUserStats[$userId]->entries_count ?? 0),
                'projects_count' => (int) ($byUserStats[$userId]->projects_count ?? 0),
            ])->sortByDesc('total_hours')->values(),
            'byProject' => $totalsByProject->map(fn ($hours, $projectId) => [
                'project_id' => (int) $projectId,
                'project_name' => $projects[$projectId]->name ?? 'Projekt #'.$projectId,
                'total_hours' => (float) $hours,
                'entries_count' => (int) ($byProjectStats[$projectId]->entries_count ?? 0),
                'top_contributors' => $topContributors[$projectId] ?? [],
            ])->sortByDesc('total_hours')->values(),
            'timeline' => $timeline,
        ];
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

    private function normalizedFilters(Request $request): array
    {
        $status = $request->string('status', TimeEntryStatusEnum::Approved->value)->toString();
        if (! in_array($status, [...TimeEntryStatusEnum::values(), 'all'], true)) {
            $status = TimeEntryStatusEnum::Approved->value;
        }

        return [
            'date_from' => $request->string('date_from', now()->startOfMonth()->toDateString())->toString(),
            'date_to' => $request->string('date_to', now()->toDateString())->toString(),
            'project_ids' => $this->idsFromRequest($request, 'project_ids'),
            'user_ids' => $this->idsFromRequest($request, 'user_ids'),
            'status' => $status,
        ];
    }

    private function filterOptions(Request $request): array
    {
        $projectIds = $this->scopedProjectIds($request);
        $projects = Project::query()
            ->when($projectIds !== null, fn ($query) => $query->whereIn('id', $projectIds))
            ->orderBy('name')
            ->get(['id', 'name']);

        $users = User::query()
            ->whereIn('id', TimeEntry::query()
                ->when($projectIds !== null, fn ($query) => $query->whereIn('project_id', $projectIds))
                ->select('user_id')
                ->distinct())
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return [
            'projects' => $projects,
            'users' => $users,
        ];
    }

    private function scopedProjectIds(Request $request): ?array
    {
        $user = $request->user();

        if ($user->is_admin) {
            return null;
        }

        $projectIds = Project::query()
            ->where(function (Builder $query) use ($user) {
                $query
                    ->where('owner_id', $user->id)
                    ->orWhereHas('team', function (Builder $teamQuery) use ($user) {
                        $teamQuery
                            ->where('user_id', $user->id)
                            ->where(function (Builder $permissionQuery) {
                                $permissionQuery
                                    ->whereJsonContains('permissions', 'view_all_time_entries')
                                    ->orWhereJsonContains('permissions', 'manage_time_entries');
                            });
                    });
            })
            ->pluck('id')
            ->all();

        abort_if($projectIds === [], 403);

        return $projectIds;
    }

    private function intersectIds(?array $scopeIds, array $requestedIds): ?array
    {
        if ($scopeIds === null) {
            return $requestedIds ?: null;
        }

        if ($requestedIds === []) {
            return $scopeIds;
        }

        return array_values(array_intersect($scopeIds, $requestedIds));
    }

    private function idsFromRequest(Request $request, string $key): array
    {
        $value = $request->input($key, []);

        if (is_string($value)) {
            $value = array_filter(explode(',', $value));
        }

        if (! is_array($value)) {
            return [];
        }

        return array_values(array_unique(array_map('intval', $value)));
    }
}
