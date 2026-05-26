<?php

use Modules\CapacityManagement\Enums\CapacityPermission;
use Modules\Project\Enums\ProjectGlobalPermission;
use Modules\User\Contracts\PermissionRegistryInterface;
use Modules\User\Enums\UserPermission;
use Modules\Project\Enums\ProjectPermission;
use Modules\Project\Models\Comment;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\User\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    foreach (app(PermissionRegistryInterface::class)->all() as $permission) {
        Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
    }
});

function actionIds(array $results): array
{
    return collect($results['actions'] ?? [])->pluck('id')->all();
}

test('admin can search across modules and sees permitted quick actions', function () {
    $admin = User::factory()->create(['is_admin' => true, 'name' => 'CRM Admin']);
    $admin->syncPermissions(app(PermissionRegistryInterface::class)->all());

    $project = Project::factory()->create(['name' => 'CRM Alpha']);
    $task = Task::factory()->create([
        'project_id' => $project->id,
        'title' => 'CRM onboarding task',
    ]);
    Comment::create([
        'task_id' => $task->id,
        'user_id' => $admin->id,
        'body' => 'CRM comment detail',
    ]);
    User::factory()->create(['name' => 'CRM User', 'email' => 'crm@example.com']);

    $searchResults = $this->actingAs($admin)
        ->getJson('/api/global-search?q=CRM')
        ->assertOk()
        ->json('results');

    expect(collect($searchResults['projects'])->pluck('title'))->toContain('CRM Alpha')
        ->and(collect($searchResults['tasks'])->pluck('title'))->toContain('CRM onboarding task')
        ->and(collect($searchResults['comments'])->pluck('title')->implode(' '))->toContain('CRM comment detail')
        ->and(collect($searchResults['users'])->pluck('title'))->toContain('CRM User');

    $quickActions = $this->actingAs($admin)
        ->getJson('/api/global-search')
        ->assertOk()
        ->json('results');

    expect($quickActions['projects'])->toBe([])
        ->and(actionIds($quickActions))->toContain(
            'create-project',
            "create-task-{$project->id}",
            'manager-dashboard',
            'time-reports',
            'time-approvals',
            'capacity-management',
        );
});

test('default user only sees visible project content and shared users', function () {
    $user = User::factory()->create(['name' => 'Regular User']);
    $sharedUser = User::factory()->create(['name' => 'CRM Shared Teammate', 'email' => 'shared@example.com']);
    $hiddenUser = User::factory()->create(['name' => 'CRM Hidden User', 'email' => 'hidden@example.com']);

    $visibleProject = Project::factory()->create(['name' => 'CRM Visible Project']);
    $visibleProject->team()->attach($user->id, [
        'permissions' => json_encode([ProjectPermission::VIEW_PROJECT->value, ProjectPermission::VIEW_TASKS->value]),
        'allocation' => 100,
    ]);
    $visibleProject->team()->attach($sharedUser->id, [
        'permissions' => json_encode([ProjectPermission::VIEW_PROJECT->value]),
        'allocation' => 100,
    ]);

    $visibleTask = Task::factory()->create([
        'project_id' => $visibleProject->id,
        'title' => 'CRM visible task',
    ]);
    Comment::create([
        'task_id' => $visibleTask->id,
        'user_id' => $sharedUser->id,
        'body' => 'CRM visible comment',
    ]);

    $hiddenProject = Project::factory()->create([
        'owner_id' => $hiddenUser->id,
        'name' => 'CRM Hidden Project',
    ]);
    $hiddenTask = Task::factory()->create([
        'project_id' => $hiddenProject->id,
        'title' => 'CRM hidden task',
    ]);
    Comment::create([
        'task_id' => $hiddenTask->id,
        'user_id' => $hiddenUser->id,
        'body' => 'CRM hidden comment',
    ]);

    $results = $this->actingAs($user)
        ->getJson('/api/global-search?q=CRM')
        ->assertOk()
        ->json('results');

    expect(collect($results['projects'])->pluck('title'))->toContain('CRM Visible Project')->not->toContain('CRM Hidden Project')
        ->and(collect($results['tasks'])->pluck('title'))->toContain('CRM visible task')->not->toContain('CRM hidden task')
        ->and(collect($results['comments'])->pluck('title')->implode(' '))->toContain('CRM visible comment')->not->toContain('CRM hidden comment')
        ->and(collect($results['users'])->pluck('title'))->toContain('CRM Shared Teammate')->not->toContain('CRM Hidden User');
});

test('create actions respect global and project permissions', function () {
    $creator = User::factory()->create();
    $creator->givePermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value);

    $taskCreator = User::factory()->create();
    $allowedProject = Project::factory()->create(['name' => 'CRM Allowed Project']);
    $blockedProject = Project::factory()->create(['name' => 'CRM Blocked Project']);

    $allowedProject->team()->attach($taskCreator->id, [
        'permissions' => json_encode([
            ProjectPermission::VIEW_PROJECT->value,
            ProjectPermission::VIEW_TASKS->value,
            ProjectPermission::CREATE_TASKS->value,
        ]),
        'allocation' => 100,
    ]);
    $blockedProject->team()->attach($taskCreator->id, [
        'permissions' => json_encode([ProjectPermission::VIEW_PROJECT->value, ProjectPermission::VIEW_TASKS->value]),
        'allocation' => 100,
    ]);

    $creatorActions = $this->actingAs($creator)
        ->getJson('/api/global-search')
        ->assertOk()
        ->json('results.actions');

    expect(collect($creatorActions)->pluck('id'))->toContain('create-project');

    $taskCreatorActions = $this->actingAs($taskCreator)
        ->getJson('/api/global-search?q=CRM')
        ->assertOk()
        ->json('results.actions');

    expect(collect($taskCreatorActions)->pluck('id'))->toContain("create-task-{$allowedProject->id}")
        ->not->toContain("create-task-{$blockedProject->id}");
});

test('project creation endpoint requires create permission', function () {
    $user = User::factory()->create();
    $creator = User::factory()->create();
    $creator->givePermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value);

    $payload = [
        'name' => 'Permission Project',
        'description' => 'Test',
        'status' => 'planning',
        'priority' => 'medium',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addWeek()->toDateString(),
        'team_members' => [],
    ];

    $this->actingAs($user)
        ->post('/projects', $payload)
        ->assertForbidden();

    $this->actingAs($creator)
        ->post('/projects', $payload)
        ->assertRedirect();

    $this->assertDatabaseHas('projects', ['name' => 'Permission Project']);
});
