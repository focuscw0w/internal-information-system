<?php

namespace App\Http\Controllers;

use App\Enums\PermissionEnum;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Modules\CapacityManagement\Contracts\CapacityManagementServiceInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\TimeTracking\Services\TimeEntryService;
use Modules\User\Models\User;
use Throwable;

class ManagerController extends Controller
{
    public function __construct(
        private readonly CapacityManagementServiceInterface $capacityService,
        private readonly TimeEntryService $timeEntryService,
    ) {}

    public function dashboard(): Response
    {
        $user = auth()->user();
        $isAdmin = (bool) $user->is_admin;
        $widgets = [];

        if ($isAdmin || $this->hasGlobalPermission($user, PermissionEnum::CAPACITY_MANAGE->value)) {
            $dashboard = $this->capacityService->buildDashboard();
            $people = collect($dashboard['people'] ?? []);

            $widgets['teamUtilization'] = [
                'avg_utilization' => (float) ($dashboard['weekly_overview']['utilization'] ?? 0),
                'overloaded_count' => $people->where('is_over_capacity', true)->count(),
                'free_count' => $people->where('weekly_utilization', '<', 80)->count(),
            ];

            $widgets['teamMembers'] = $people
                ->sortByDesc('weekly_utilization')
                ->take(8)
                ->values()
                ->map(fn (array $person) => [
                    'id' => (int) ($person['id'] ?? 0),
                    'name' => (string) ($person['name'] ?? 'Bez mena'),
                    'weekly_capacity_hours' => (float) ($person['weekly_capacity_hours'] ?? 40),
                    'weekly_load_hours' => (float) ($person['weekly_load_hours'] ?? 0),
                    'weekly_utilization' => (float) ($person['weekly_utilization'] ?? 0),
                    'free_capacity_hours' => (float) ($person['free_capacity_hours'] ?? 0),
                    'is_over_capacity' => (bool) ($person['is_over_capacity'] ?? false),
                    'status' => (string) ($person['status'] ?? 'green'),
                ])
                ->all();
        }

        $managedTimeProjectIds = $this->managedTimeProjectIds($user, $isAdmin);

        if ($isAdmin || $managedTimeProjectIds->isNotEmpty()) {
            $pendingApprovalsQuery = TimeEntry::pending()
                ->when(! $isAdmin, fn ($query) => $query->whereIn('project_id', $managedTimeProjectIds));

            $widgets['pendingApprovals'] = [
                'count' => (clone $pendingApprovalsQuery)->count(),
            ];

            $widgets['pendingApprovalEntries'] = (clone $pendingApprovalsQuery)
                ->with(['user:id,name,email', 'project:id,name', 'task:id,title'])
                ->orderBy('entry_date')
                ->limit(8)
                ->get()
                ->map(fn (TimeEntry $entry) => [
                    'id' => $entry->id,
                    'entry_date' => $entry->entry_date?->toDateString(),
                    'hours' => (float) $entry->hours,
                    'description' => $entry->description,
                    'user' => [
                        'id' => $entry->user?->id,
                        'name' => $entry->user?->name ?? 'Bez mena',
                        'email' => $entry->user?->email,
                    ],
                    'project' => [
                        'id' => $entry->project?->id,
                        'name' => $entry->project?->name ?? 'Bez projektu',
                    ],
                    'task' => [
                        'id' => $entry->task?->id,
                        'title' => $entry->task?->title ?? 'Bez úlohy',
                    ],
                ])
                ->all();
        }

        $managedProjectIds = $this->managedProjectIds($user, $isAdmin);

        if ($isAdmin || $managedProjectIds->isNotEmpty()) {
            $widgets['overdueTasks'] = Task::overdue()
                ->when(! $isAdmin, fn ($query) => $query->whereIn('project_id', $managedProjectIds))
                ->with('project:id,name')
                ->orderBy('due_date')
                ->limit(6)
                ->get()
                ->map(fn (Task $task) => [
                    'id' => $task->id,
                    'project_id' => $task->project_id,
                    'title' => $task->title,
                    'due_date' => $task->due_date?->toDateString(),
                    'priority' => $task->priority,
                    'project' => [
                        'id' => $task->project?->id,
                        'name' => $task->project?->name ?? 'Bez projektu',
                    ],
                ]);

            $widgets['atRiskProjects'] = Project::query()
                ->when(! $isAdmin, fn ($query) => $query->whereIn('id', $managedProjectIds))
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->with(['tasks', 'owner:id,name'])
                ->get()
                ->filter(fn (Project $project) => $project->is_at_risk)
                ->take(6)
                ->values()
                ->map(fn (Project $project) => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'status' => $project->status,
                    'progress' => $project->progress,
                    'end_date' => $project->end_date?->toDateString(),
                    'is_overdue' => $project->is_overdue,
                    'days_remaining' => $project->days_remaining,
                    'owner' => [
                        'id' => $project->owner?->id,
                        'name' => $project->owner?->name ?? 'Bez vlastníka',
                    ],
                ]);

            $widgets['managedProjects'] = Project::query()
                ->when(! $isAdmin, fn ($query) => $query->whereIn('id', $managedProjectIds))
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->withCount('team')
                ->orderByRaw('CASE WHEN end_date IS NULL THEN 1 ELSE 0 END')
                ->orderBy('end_date')
                ->limit(8)
                ->get()
                ->map(fn (Project $project) => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'status' => $project->status,
                    'progress' => $project->progress,
                    'end_date' => $project->end_date?->toDateString(),
                    'team_size' => (int) $project->team_count,
                    'is_overdue' => $project->is_overdue,
                    'days_remaining' => $project->days_remaining,
                    'is_at_risk' => $project->is_at_risk,
                ])
                ->all();
        }

        $viewTimeProjectIds = $this->viewTimeProjectIds($user, $isAdmin);

        if ($isAdmin || $viewTimeProjectIds->isNotEmpty()) {
            $from = Carbon::now()->subDays(6)->startOfDay();
            $to = Carbon::now()->endOfDay();
            $projectIds = $isAdmin ? null : $viewTimeProjectIds->all();
            $totals = $this->timeEntryService->getTotalHoursPerUserInPeriod($from, $to, null, $projectIds);
            $users = User::query()
                ->whereIn('id', $totals->keys()->all())
                ->get(['id', 'name'])
                ->keyBy('id');

            $widgets['teamHoursThisWeek'] = [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'members' => $totals
                    ->map(fn ($hours, $userId) => [
                        'user_id' => (int) $userId,
                        'name' => $users[$userId]->name ?? 'Používateľ #'.$userId,
                        'hours' => (float) $hours,
                    ])
                    ->sortByDesc('hours')
                    ->values()
                    ->all(),
            ];
        }

        return Inertia::render('manager/Dashboard', [
            'widgets' => $widgets,
        ]);
    }

    private function managedProjectIds($user, bool $isAdmin): Collection
    {
        if ($isAdmin) {
            return Project::query()->pluck('id');
        }

        return Project::managedBy($user)->pluck('id');
    }

    private function managedTimeProjectIds($user, bool $isAdmin): Collection
    {
        if ($isAdmin) {
            return Project::query()->pluck('id');
        }

        return Project::whereUserCanManageTimeEntries($user)->pluck('id');
    }

    private function viewTimeProjectIds($user, bool $isAdmin): Collection
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

    private function hasGlobalPermission($user, string $permission): bool
    {
        try {
            return $user->can($permission);
        } catch (Throwable) {
            return false;
        }
    }
}
