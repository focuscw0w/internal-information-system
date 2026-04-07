<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Models\TimeEntry;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware('auth')->group(function () {
    Route::get('dashboard', function () {
        $user = auth()->user();
        $today = now()->toDateString();
        $weekStart = now()->startOfWeek()->toDateString();

        $myTasksToday = Task::query()
            ->whereHas('assignedUsers', fn ($query) => $query->where('users.id', $user->id))
            ->where('status', '!=', 'done')
            ->whereDate('due_date', '<=', $today)
            ->with('project:id,name')
            ->orderBy('due_date')
            ->limit(6)
            ->get()
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

        $atRiskProjects = Project::query()
            ->forUser($user->id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->with(['tasks', 'owner:id,name'])
            ->get()
            ->filter(fn (Project $project) => $project->is_at_risk || $project->is_overdue)
            ->sortBy([
                ['is_overdue', 'desc'],
                ['days_remaining', 'asc'],
            ])
            ->take(5)
            ->values()
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

        $weekEntries = TimeEntry::query()
            ->forUser($user->id)
            ->whereDate('entry_date', '>=', $weekStart)
            ->whereDate('entry_date', '<=', $today);

        $timeWeekToDate = [
            'week_start' => $weekStart,
            'week_end' => $today,
            'logged_hours' => (float) (clone $weekEntries)->sum('hours'),
            'today_hours' => (float) (clone $weekEntries)->whereDate('entry_date', $today)->sum('hours'),
            'entries_count' => (clone $weekEntries)->count(),
            'unsubmitted_hours' => (float) (clone $weekEntries)->sum('hours'),
            'approved_hours' => 0.0,
            'approval_enabled' => false,
        ];

        return Inertia::render('dashboard', [
            'myTasksToday' => $myTasksToday,
            'atRiskProjects' => $atRiskProjects,
            'timeWeekToDate' => $timeWeekToDate,
        ]);
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require base_path('Modules/User/Routes/auth.php');
