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

        $canManageTeamGlobally = $this->hasGlobalPermission($user, 'manage_team');
        $canManageTimeGlobally = $this->hasGlobalPermission($user, 'manage_time_entries');
        $canViewAllTimeGlobally = $this->hasGlobalPermission($user, 'view_all_time_entries');

        if ($isAdmin || $this->hasGlobalPermission($user, PermissionEnum::CAPACITY_MANAGE->value)) {
            $dashboard = $this->capacityService->buildDashboard();
            $people = collect($dashboard['people'] ?? []);

            $widgets['teamUtilization'] = [
                'avg_utilization' => (float) ($dashboard['weekly_overview']['utilization'] ?? 0),
                'overloaded_count' => $people->where('is_over_capacity', true)->count(),
                'free_count' => $people->where('weekly_utilization', '<', 80)->count(),
            ];
        }

        $managedTimeProjectIds = $this->managedTimeProjectIds($user, $isAdmin || $canManageTimeGlobally);

        if ($isAdmin || $canManageTimeGlobally || $managedTimeProjectIds->isNotEmpty()) {
            $widgets['pendingApprovals'] = [
                'count' => TimeEntry::pending()
                    ->when(! $isAdmin, fn ($query) => $query->whereIn('project_id', $managedTimeProjectIds))
                    ->count(),
            ];
        }

        $managedProjectIds = $this->managedProjectIds($user, $isAdmin || $canManageTeamGlobally);

        if ($isAdmin || $canManageTeamGlobally || $managedProjectIds->isNotEmpty()) {
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
        }

        if ($isAdmin || $canViewAllTimeGlobally || $canManageTimeGlobally || $this->canViewAnyTimeEntries($user) || $managedTimeProjectIds->isNotEmpty()) {
            $from = Carbon::now()->subDays(6)->startOfDay();
            $to = Carbon::now()->endOfDay();
            $projectIds = ($isAdmin || $canViewAllTimeGlobally || $canManageTimeGlobally || $this->canViewAnyTimeEntries($user))
                ? null
                : $managedTimeProjectIds->all();
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

    private function canViewAnyTimeEntries($user): bool
    {
        return Project::query()
            ->whereHas('team', function ($query) use ($user) {
                $query
                    ->where('user_id', $user->id)
                    ->whereJsonContains('permissions', 'view_all_time_entries');
            })
            ->exists();
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
