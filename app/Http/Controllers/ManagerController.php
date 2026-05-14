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
        $canManageCapacity = $isAdmin || $this->hasGlobalPermission($user, PermissionEnum::CAPACITY_MANAGE->value);
        $widgets = [];
        $from = Carbon::now()->subDays(6)->startOfDay();
        $to = Carbon::now()->endOfDay();

        if ($canManageCapacity) {
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

        $widgets = array_merge(
            $widgets,
            $this->buildTeamWidgets($user, $isAdmin, $canManageCapacity, $from, $to),
        );

        return Inertia::render('manager/Dashboard', [
            'widgets' => $widgets,
        ]);
    }

    private function buildTeamWidgets($user, bool $isAdmin, bool $canManageCapacity, Carbon $from, Carbon $to): array
    {
        $projects = $this->teamProjects($user, $isAdmin, $canManageCapacity);
        $projectIds = $projects->pluck('id')->all();
        $includeUnassigned = $isAdmin || $canManageCapacity;

        $participantIds = $projects
            ->flatMap(function (Project $project) {
                return collect([$project->owner_id])
                    ->merge($project->team->pluck('id'));
            })
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $aggregateUserIds = $includeUnassigned
            ? User::query()->pluck('id')->map(fn ($id) => (int) $id)->values()
            : $participantIds;

        $capacityByUser = $this->capacityService->getPeopleSnapshotForUsers($aggregateUserIds->all());
        $usersById = User::query()
            ->whereIn('id', $aggregateUserIds->all())
            ->get(['id', 'name', 'email'])
            ->keyBy('id');

        $projectHours = TimeEntry::query()
            ->when($projectIds !== [], fn ($query) => $query->whereIn('project_id', $projectIds))
            ->whereDate('entry_date', '>=', $from)
            ->whereDate('entry_date', '<=', $to)
            ->selectRaw('project_id, user_id, COALESCE(SUM(hours), 0) as total')
            ->groupBy('project_id', 'user_id')
            ->get()
            ->groupBy('project_id')
            ->map(fn ($entries) => $entries->pluck('total', 'user_id')->map(fn ($hours) => (float) $hours));

        $totalHoursByUser = $this->timeEntryService
            ->getTotalHoursPerUserInPeriod(
                $from,
                $to,
                $includeUnassigned ? null : $aggregateUserIds->all(),
                $includeUnassigned ? null : $projectIds,
            )
            ->map(fn ($hours) => (float) $hours);

        $groups = $projects
            ->map(function (Project $project) use ($capacityByUser, $projectHours) {
                $members = collect();

                if ($project->owner) {
                    $members->push([
                        'user' => $project->owner,
                        'role' => 'owner',
                        'permissions' => ['owner'],
                        'allocation' => 100,
                    ]);
                }

                foreach ($project->team as $member) {
                    if ($project->owner_id === $member->id) {
                        continue;
                    }

                    $permissions = $member->pivot->permissions;

                    if (is_string($permissions)) {
                        $permissions = json_decode($permissions, true) ?? [];
                    }

                    $members->push([
                        'user' => $member,
                        'role' => 'member',
                        'permissions' => is_array($permissions) ? $permissions : [],
                        'allocation' => (int) ($member->pivot->allocation ?? 0),
                    ]);
                }

                $allocations = $project->allocations->keyBy('user_id');

                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'status' => $project->status,
                    'progress' => $project->progress,
                    'end_date' => $project->end_date?->toDateString(),
                    'is_overdue' => $project->is_overdue,
                    'days_remaining' => $project->days_remaining,
                    'is_at_risk' => $project->is_at_risk,
                    'members' => $members
                        ->map(function (array $entry) use ($project, $allocations, $capacityByUser, $projectHours) {
                            $member = $entry['user'];
                            $stats = $this->capacityStatsForUser((int) $member->id, $capacityByUser);
                            $allocation = $allocations->get($member->id);
                            $percentage = (int) ($allocation?->percentage ?? $entry['allocation']);
                            $projectCapacity = $percentage > 0
                                ? round($stats['weekly_capacity_hours'] * ($percentage / 100), 2)
                                : 0.0;
                            $projectLoad = (float) ($projectHours->get($project->id)?->get($member->id) ?? 0);
                            $projectUtilization = $projectCapacity > 0
                                ? round(($projectLoad / $projectCapacity) * 100)
                                : 0;

                            return [
                                'id' => (int) $member->id,
                                'name' => (string) $member->name,
                                'email' => $member->email,
                                'role' => $entry['role'],
                                'permissions' => $entry['permissions'],
                                'project_allocation' => $percentage,
                                'project_weekly_hours' => $projectLoad,
                                'weekly_capacity_hours' => $projectCapacity,
                                'weekly_load_hours' => $projectLoad,
                                'weekly_utilization' => $projectUtilization,
                                'free_capacity_hours' => max($projectCapacity - $projectLoad, 0),
                                'is_over_capacity' => $projectCapacity > 0 && $projectLoad > $projectCapacity,
                                'total_weekly_capacity_hours' => $stats['weekly_capacity_hours'],
                                'total_weekly_load_hours' => $stats['weekly_load_hours'],
                                'total_weekly_utilization' => $stats['weekly_utilization'],
                            ];
                        })
                        ->sortBy('name')
                        ->values()
                        ->all(),
                ];
            })
            ->values();

        if ($includeUnassigned) {
            $assignedIds = $participantIds->all();
            $unassignedMembers = $usersById
                ->reject(fn (User $member) => in_array((int) $member->id, $assignedIds, true))
                ->map(function (User $member) use ($capacityByUser, $totalHoursByUser) {
                    $stats = $this->capacityStatsForUser((int) $member->id, $capacityByUser);
                    $load = (float) ($totalHoursByUser[$member->id] ?? $stats['weekly_load_hours']);
                    $utilization = $stats['weekly_capacity_hours'] > 0
                        ? round(($load / $stats['weekly_capacity_hours']) * 100)
                        : 0;

                    return [
                        'id' => (int) $member->id,
                        'name' => (string) $member->name,
                        'email' => $member->email,
                        'role' => 'unassigned',
                        'permissions' => [],
                        'project_allocation' => 0,
                        'project_weekly_hours' => $load,
                        'weekly_capacity_hours' => $stats['weekly_capacity_hours'],
                        'weekly_load_hours' => $load,
                        'weekly_utilization' => $utilization,
                        'free_capacity_hours' => max($stats['weekly_capacity_hours'] - $load, 0),
                        'is_over_capacity' => $load > $stats['weekly_capacity_hours'],
                        'total_weekly_capacity_hours' => $stats['weekly_capacity_hours'],
                        'total_weekly_load_hours' => $load,
                        'total_weekly_utilization' => $utilization,
                    ];
                })
                ->sortBy('name')
                ->values()
                ->all();

            if ($unassignedMembers !== []) {
                $groups->push([
                    'id' => null,
                    'name' => 'Bez projektu',
                    'status' => 'unassigned',
                    'progress' => 0,
                    'end_date' => null,
                    'is_overdue' => false,
                    'days_remaining' => 0,
                    'is_at_risk' => false,
                    'members' => $unassignedMembers,
                ]);
            }
        }

        return [
            'teamProjectGroups' => $groups->all(),
            'teamMembers' => $this->aggregateTeamMembers($groups, $usersById, $capacityByUser, $totalHoursByUser),
        ];
    }

    private function teamProjects($user, bool $isAdmin, bool $canManageCapacity): Collection
    {
        return Project::query()
            ->when(! ($isAdmin || $canManageCapacity), function ($query) use ($user) {
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

    private function capacityStatsForUser(int $userId, array $capacityByUser): array
    {
        return [
            'weekly_capacity_hours' => (float) ($capacityByUser[$userId]['weekly_capacity_hours'] ?? 40),
            'weekly_load_hours' => (float) ($capacityByUser[$userId]['weekly_load_hours'] ?? 0),
            'weekly_utilization' => (float) ($capacityByUser[$userId]['weekly_utilization'] ?? 0),
            'free_capacity_hours' => (float) ($capacityByUser[$userId]['free_capacity_hours'] ?? 40),
            'is_over_capacity' => (bool) ($capacityByUser[$userId]['is_over_capacity'] ?? false),
        ];
    }

    private function aggregateTeamMembers(Collection $groups, Collection $usersById, array $capacityByUser, Collection $totalHoursByUser): array
    {
        return $usersById
            ->map(function (User $member) use ($groups, $capacityByUser, $totalHoursByUser) {
                $stats = $this->capacityStatsForUser((int) $member->id, $capacityByUser);
                $projects = $groups
                    ->filter(fn (array $group) => $group['id'] !== null)
                    ->flatMap(function (array $group) use ($member) {
                        return collect($group['members'])
                            ->where('id', $member->id)
                            ->map(fn (array $projectMember) => [
                                'id' => $group['id'],
                                'name' => $group['name'],
                                'allocation' => $projectMember['project_allocation'],
                                'weekly_hours' => $projectMember['project_weekly_hours'],
                                'role' => $projectMember['role'],
                            ]);
                    })
                    ->values()
                    ->all();
                $load = (float) ($totalHoursByUser[$member->id] ?? $stats['weekly_load_hours']);
                $utilization = $stats['weekly_capacity_hours'] > 0
                    ? round(($load / $stats['weekly_capacity_hours']) * 100)
                    : 0;

                return [
                    'id' => (int) $member->id,
                    'name' => (string) $member->name,
                    'weekly_capacity_hours' => $stats['weekly_capacity_hours'],
                    'weekly_load_hours' => $load,
                    'weekly_utilization' => $utilization,
                    'free_capacity_hours' => max($stats['weekly_capacity_hours'] - $load, 0),
                    'is_over_capacity' => $load > $stats['weekly_capacity_hours'],
                    'project_count' => count($projects),
                    'projects' => $projects,
                ];
            })
            ->sortByDesc('weekly_utilization')
            ->values()
            ->all();
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
