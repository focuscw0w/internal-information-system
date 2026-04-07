<?php

use Carbon\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;

beforeEach(function () {
    Carbon::setTestNow('2026-04-07 10:00:00');
});

afterEach(function () {
    Carbon::setTestNow();
});

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get(route('dashboard'))->assertOk();
});

test('dashboard includes cross module overview data', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create([
        'owner_id' => $user->id,
        'name' => 'Rizikový projekt',
        'status' => 'active',
        'progress' => 40,
        'start_date' => now()->subMonth(),
        'end_date' => now()->subDay(),
    ]);
    $task = Task::factory()->create([
        'project_id' => $project->id,
        'title' => 'Dnešná úloha',
        'status' => 'todo',
        'priority' => 'high',
        'due_date' => now()->toDateString(),
    ]);
    $task->assignedUsers()->attach($user->id);

    TimeEntry::factory()->create([
        'project_id' => $project->id,
        'task_id' => $task->id,
        'user_id' => $user->id,
        'entry_date' => '2026-04-06',
        'hours' => 2.5,
    ]);
    TimeEntry::factory()->create([
        'project_id' => $project->id,
        'task_id' => $task->id,
        'user_id' => $user->id,
        'entry_date' => '2026-04-07',
        'hours' => 1.5,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('myTasksToday.0.title', 'Dnešná úloha')
            ->where('atRiskProjects.0.name', 'Rizikový projekt')
            ->where('timeWeekToDate.logged_hours', 4)
            ->where('timeWeekToDate.today_hours', 1.5)
            ->where('timeWeekToDate.approval_enabled', false)
        );
});
