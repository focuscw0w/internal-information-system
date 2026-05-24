<?php

namespace Modules\CapacityManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\CapacityManagement\Contracts\Repositories\CapacityDashboardRepositoryInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;

class DashboardController extends Controller
{
    public function __construct(private readonly CapacityDashboardRepositoryInterface $dashboardRepository) {}

    public function index(): Response
    {
        $user = auth()->user();
        $today = now()->toDateString();
        $weekStart = now()->startOfWeek()->toDateString();

        $myTasksToday = $this->dashboardRepository
            ->tasksDueForUser($user, $today)
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'project_id' => $task->project_id,
                'title' => $task->title,
                'status' => $task->status,
                'priority' => $task->priority,
                'due_date' => $task->due_date?->toDateString(),
                'is_overdue' => $task->due_date?->isBefore(now()->startOfDay()) ?? false,
                'project' => [
                    'id' => $task->project?->id,
                    'name' => $task->project?->name ?? 'Bez projektu',
                ],
            ]);

        $atRiskProjects = $this->dashboardRepository
            ->atRiskProjectsForUser($user)
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status,
                'progress' => $project->progress,
                'end_date' => $project->end_date?->toDateString(),
                'is_overdue' => $project->is_overdue,
                'days_remaining' => $project->days_remaining,
                'at_risk_tasks_count' => $project->tasks
                    ->filter(fn (Task $task) => $task->status !== 'done' && $task->is_at_risk)
                    ->count(),
                'owner' => [
                    'id' => $project->owner?->id,
                    'name' => $project->owner?->name ?? 'Bez vlastníka',
                ],
            ]);

        $weekStats = $this->dashboardRepository->weekTimeEntryStatsForUser($user->id, $weekStart, $today);

        $timeWeekToDate = [
            'week_start' => $weekStart,
            'week_end' => $today,
            'logged_hours' => $weekStats['logged_hours'],
            'today_hours' => $weekStats['today_hours'],
            'entries_count' => $weekStats['entries_count'],
            'unsubmitted_hours' => $weekStats['logged_hours'],
            'approved_hours' => 0.0,
            'approval_enabled' => false,
        ];

        return Inertia::render('CapacityManagement/dashboard', [
            'myTasksToday' => $myTasksToday,
            'atRiskProjects' => $atRiskProjects,
            'timeWeekToDate' => $timeWeekToDate,
        ]);
    }
}
