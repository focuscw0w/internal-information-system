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
        $type = $request->string('type', 'summary')->toString();
        if (! in_array($type, ['summary', 'details'], true)) {
            $type = 'summary';
        }

        $filename = 'time-report-'.$type.'-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($request, $filters, $type) {
            echo "\xEF\xBB\xBF";
            $handle = fopen('php://output', 'w');

            if ($type === 'details') {
                $this->writeDetailsExport($handle, $request, $filters);
            } else {
                $this->writeSummaryExport($handle, $request, $filters);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function writeSummaryExport($handle, Request $request, array $filters): void
    {
        fputcsv($handle, [
            'Projekt',
            'Osoba',
            'Email',
            'Celkové hodiny',
            'Schválené hodiny',
            'Čakajúce hodiny',
            'Zamietnuté hodiny',
            'Počet záznamov',
        ], ';');

        foreach ($this->summaryExportRows($request, $filters) as $row) {
            fputcsv($handle, [
                $row['project_name'],
                $row['user_name'],
                $row['user_email'],
                $this->csvHours($row['total_hours']),
                $this->csvHours($row['approved_hours']),
                $this->csvHours($row['pending_hours']),
                $this->csvHours($row['rejected_hours']),
                $row['entries_count'],
            ], ';');
        }
    }

    private function writeDetailsExport($handle, Request $request, array $filters): void
    {
        fputcsv($handle, [
            'Dátum',
            'Osoba',
            'Email',
            'Projekt',
            'Úloha',
            'Hodiny',
            'Stav',
            'Popis',
            'Schválil',
            'Schválené dňa',
            'Dôvod zamietnutia',
        ], ';');

        foreach ($this->detailExportRows($request, $filters) as $row) {
            fputcsv($handle, [
                $row['entry_date'],
                $row['user_name'],
                $row['user_email'],
                $row['project_name'],
                $row['task_title'],
                $this->csvHours($row['hours']),
                $row['status'],
                $row['description'],
                $row['approved_by'],
                $row['approved_at'],
                $row['rejection_reason'],
            ], ';');
        }
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

    private function summaryExportRows(Request $request, array $filters): array
    {
        $from = Carbon::parse($filters['date_from'])->startOfDay();
        $to = Carbon::parse($filters['date_to'])->endOfDay();
        $projectScope = $this->scopedProjectIds($request);
        $projectIds = $this->intersectIds($projectScope, $filters['project_ids']);
        $userIds = $filters['user_ids'] ?: null;

        return $this->baseEntriesQuery($from, $to, $userIds, $projectIds, $filters['status'])
            ->with(['user:id,name,email', 'project:id,name'])
            ->get(['id', 'project_id', 'user_id', 'hours', 'status'])
            ->groupBy(fn (TimeEntry $entry) => $entry->user_id.'-'.$entry->project_id)
            ->map(function ($entries) {
                /** @var TimeEntry $first */
                $first = $entries->first();

                return [
                    'user_name' => $first->user?->name ?? 'Používateľ #'.$first->user_id,
                    'user_email' => $first->user?->email ?? '',
                    'project_name' => $first->project?->name ?? 'Projekt #'.$first->project_id,
                    'total_hours' => (float) $entries->sum('hours'),
                    'approved_hours' => (float) $entries
                        ->where('status', TimeEntryStatusEnum::Approved->value)
                        ->sum('hours'),
                    'pending_hours' => (float) $entries
                        ->where('status', TimeEntryStatusEnum::Pending->value)
                        ->sum('hours'),
                    'rejected_hours' => (float) $entries
                        ->where('status', TimeEntryStatusEnum::Rejected->value)
                        ->sum('hours'),
                    'entries_count' => $entries->count(),
                ];
            })
            ->sortBy([
                ['project_name', 'asc'],
                ['user_name', 'asc'],
            ])
            ->values()
            ->all();
    }

    private function detailExportRows(Request $request, array $filters): array
    {
        $from = Carbon::parse($filters['date_from'])->startOfDay();
        $to = Carbon::parse($filters['date_to'])->endOfDay();
        $projectScope = $this->scopedProjectIds($request);
        $projectIds = $this->intersectIds($projectScope, $filters['project_ids']);
        $userIds = $filters['user_ids'] ?: null;

        return $this->baseEntriesQuery($from, $to, $userIds, $projectIds, $filters['status'])
            ->with([
                'user:id,name,email',
                'project:id,name',
                'task:id,title',
                'approver:id,name',
            ])
            ->orderBy('entry_date')
            ->orderBy('project_id')
            ->orderBy('user_id')
            ->get()
            ->map(fn (TimeEntry $entry) => [
                'entry_date' => $entry->entry_date?->toDateString(),
                'user_name' => $entry->user?->name ?? 'Používateľ #'.$entry->user_id,
                'user_email' => $entry->user?->email ?? '',
                'project_name' => $entry->project?->name ?? 'Projekt #'.$entry->project_id,
                'task_title' => $entry->task?->title ?? 'Úloha #'.$entry->task_id,
                'hours' => (float) $entry->hours,
                'status' => TimeEntryStatusEnum::tryFrom($entry->status)?->label() ?? $entry->status,
                'description' => $entry->description ?? '',
                'approved_by' => $entry->approver?->name ?? '',
                'approved_at' => $entry->approved_at?->format('Y-m-d H:i:s') ?? '',
                'rejection_reason' => $entry->rejection_reason ?? '',
            ])
            ->all();
    }

    private function csvHours(float $hours): string
    {
        return number_format($hours, 2, '.', '');
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
                            ->whereJsonContains('permissions', 'manage_time_entries');
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
