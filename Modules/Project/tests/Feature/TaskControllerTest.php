<?php

namespace Modules\Project\Tests\Feature;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\Project\Tests\Concerns\HasProjectHelpers;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TaskControllerTest extends TestCase
{
    use RefreshDatabase, HasProjectHelpers;

    private User $owner;
    private Project $project;
    private Task $task;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(PermissionSeeder::class);

        $this->owner = User::factory()->create();
        $this->project = $this->createProject($this->owner);
        $this->task = Task::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'todo',
        ]);
    }

    private function validTaskPayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Testovacia úloha',
            'description' => null,
            'status' => 'todo',
            'priority' => 'medium',
            'estimated_hours' => 4,
            'due_date' => now()->addWeek()->format('Y-m-d'),
        ], $overrides);
    }

    // =========================================================================
    // store
    // =========================================================================

    #[Test]
    public function owner_can_create_task(): void
    {
        $this->actingAs($this->owner)
            ->post("/projects/{$this->project->id}/tasks", $this->validTaskPayload())
            ->assertRedirect();

        $this->assertDatabaseHas('tasks', [
            'project_id' => $this->project->id,
            'title' => 'Testovacia úloha',
        ]);
    }

    #[Test]
    public function member_with_create_tasks_permission_can_create_task(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['create_tasks']);

        $this->actingAs($member)
            ->post("/projects/{$this->project->id}/tasks", $this->validTaskPayload())
            ->assertRedirect();
    }

    #[Test]
    public function member_without_create_tasks_permission_gets_403(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['view_tasks']);

        $this->actingAs($member)
            ->post("/projects/{$this->project->id}/tasks", $this->validTaskPayload())
            ->assertForbidden();
    }

    #[Test]
    public function outsider_cannot_create_task(): void
    {
        $outsider = User::factory()->create();

        $this->actingAs($outsider)
            ->post("/projects/{$this->project->id}/tasks", $this->validTaskPayload())
            ->assertForbidden();
    }

    #[Test]
    public function store_fails_validation_when_title_is_missing(): void
    {
        $this->actingAs($this->owner)
            ->post("/projects/{$this->project->id}/tasks", $this->validTaskPayload(['title' => '']))
            ->assertSessionHasErrors('title');
    }

    #[Test]
    public function store_fails_validation_when_status_is_invalid(): void
    {
        $this->actingAs($this->owner)
            ->post("/projects/{$this->project->id}/tasks", $this->validTaskPayload(['status' => 'invalid']))
            ->assertSessionHasErrors('status');
    }

    #[Test]
    public function store_fails_validation_when_priority_is_invalid(): void
    {
        $this->actingAs($this->owner)
            ->post("/projects/{$this->project->id}/tasks", $this->validTaskPayload(['priority' => 'critical']))
            ->assertSessionHasErrors('priority');
    }

    #[Test]
    public function store_fails_validation_when_due_date_is_missing(): void
    {
        $this->actingAs($this->owner)
            ->post("/projects/{$this->project->id}/tasks", $this->validTaskPayload(['due_date' => '']))
            ->assertSessionHasErrors('due_date');
    }

    // =========================================================================
    // show
    // =========================================================================

    #[Test]
    public function owner_can_view_task(): void
    {
        $this->actingAs($this->owner)
            ->get("/projects/{$this->project->id}/tasks/{$this->task->id}")
            ->assertOk();
    }

    #[Test]
    public function member_with_view_tasks_can_view_task(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['view_tasks']);

        $this->actingAs($member)
            ->get("/projects/{$this->project->id}/tasks/{$this->task->id}")
            ->assertOk();
    }

    #[Test]
    public function outsider_cannot_view_task(): void
    {
        $outsider = User::factory()->create();

        $this->actingAs($outsider)
            ->get("/projects/{$this->project->id}/tasks/{$this->task->id}")
            ->assertForbidden();
    }

    // =========================================================================
    // update
    // =========================================================================

    #[Test]
    public function owner_can_update_task(): void
    {
        $this->actingAs($this->owner)
            ->put("/projects/{$this->project->id}/tasks/{$this->task->id}", $this->validTaskPayload(['title' => 'Zmenený názov']))
            ->assertRedirect();

        $this->assertDatabaseHas('tasks', ['id' => $this->task->id, 'title' => 'Zmenený názov']);
    }

    #[Test]
    public function member_with_edit_tasks_can_update_task(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['edit_tasks']);

        $this->actingAs($member)
            ->put("/projects/{$this->project->id}/tasks/{$this->task->id}", $this->validTaskPayload())
            ->assertRedirect();
    }

    #[Test]
    public function member_without_edit_tasks_gets_403_on_update(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['view_tasks']);

        $this->actingAs($member)
            ->put("/projects/{$this->project->id}/tasks/{$this->task->id}", $this->validTaskPayload())
            ->assertForbidden();
    }

    // =========================================================================
    // destroy
    // =========================================================================

    #[Test]
    public function owner_can_delete_task(): void
    {
        $this->actingAs($this->owner)
            ->delete("/projects/{$this->project->id}/tasks/{$this->task->id}")
            ->assertRedirect();

        $this->assertSoftDeleted('tasks', ['id' => $this->task->id]);
    }

    #[Test]
    public function member_with_delete_tasks_can_delete_task(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['delete_tasks']);

        $this->actingAs($member)
            ->delete("/projects/{$this->project->id}/tasks/{$this->task->id}")
            ->assertRedirect();

        $this->assertSoftDeleted('tasks', ['id' => $this->task->id]);
    }

    #[Test]
    public function member_without_delete_tasks_gets_403(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['view_tasks']);

        $this->actingAs($member)
            ->delete("/projects/{$this->project->id}/tasks/{$this->task->id}")
            ->assertForbidden();
    }

    // =========================================================================
    // assign
    // =========================================================================

    #[Test]
    public function owner_can_assign_task(): void
    {
        $user = User::factory()->create();

        $this->actingAs($this->owner)
            ->post("/projects/{$this->project->id}/tasks/{$this->task->id}/assign", [
                'assigned_users' => [$user->id],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('assigned_users', [
            'task_id' => $this->task->id,
            'user_id' => $user->id,
        ]);
    }

    #[Test]
    public function member_with_assign_tasks_can_assign(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['assign_tasks']);
        $user = User::factory()->create();

        $this->actingAs($member)
            ->post("/projects/{$this->project->id}/tasks/{$this->task->id}/assign", [
                'assigned_users' => [$user->id],
            ])
            ->assertRedirect();
    }

    #[Test]
    public function member_without_assign_tasks_gets_403(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['view_tasks']);

        $this->actingAs($member)
            ->post("/projects/{$this->project->id}/tasks/{$this->task->id}/assign", [
                'assigned_users' => [],
            ])
            ->assertForbidden();
    }

    #[Test]
    public function assign_fails_when_user_does_not_exist(): void
    {
        $this->actingAs($this->owner)
            ->post("/projects/{$this->project->id}/tasks/{$this->task->id}/assign", [
                'assigned_users' => [99999],
            ])
            ->assertSessionHasErrors('assigned_users.0');
    }

    // =========================================================================
    // updateStatus
    // =========================================================================

    #[Test]
    public function owner_can_update_task_status(): void
    {
        $this->actingAs($this->owner)
            ->patch("/projects/{$this->project->id}/tasks/{$this->task->id}/status", [
                'status' => 'in_progress',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('tasks', ['id' => $this->task->id, 'status' => 'in_progress']);
    }

    #[Test]
    public function member_with_edit_tasks_can_update_status(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['edit_tasks']);

        $this->actingAs($member)
            ->patch("/projects/{$this->project->id}/tasks/{$this->task->id}/status", [
                'status' => 'in_progress',
            ])
            ->assertRedirect();
    }

    #[Test]
    public function member_without_edit_tasks_gets_403_on_status_update(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['view_tasks']);

        $this->actingAs($member)
            ->patch("/projects/{$this->project->id}/tasks/{$this->task->id}/status", [
                'status' => 'in_progress',
            ])
            ->assertForbidden();
    }

    #[Test]
    public function update_status_fails_validation_when_status_is_invalid(): void
    {
        $this->actingAs($this->owner)
            ->patch("/projects/{$this->project->id}/tasks/{$this->task->id}/status", [
                'status' => 'broken',
            ])
            ->assertSessionHasErrors('status');
    }

    // =========================================================================
    // logHours
    // =========================================================================

    #[Test]
    public function owner_can_log_hours(): void
    {
        $this->actingAs($this->owner)
            ->patch("/projects/{$this->project->id}/tasks/{$this->task->id}/log-hours", [
                'hours' => 2,
            ])
            ->assertRedirect();

        $this->assertEquals(2, $this->task->fresh()->actual_hours);
    }

    #[Test]
    public function log_hours_fails_when_hours_below_minimum(): void
    {
        $this->actingAs($this->owner)
            ->patch("/projects/{$this->project->id}/tasks/{$this->task->id}/log-hours", [
                'hours' => 0.1,
            ])
            ->assertSessionHasErrors('hours');
    }

    #[Test]
    public function log_hours_fails_when_hours_above_maximum(): void
    {
        $this->actingAs($this->owner)
            ->patch("/projects/{$this->project->id}/tasks/{$this->task->id}/log-hours", [
                'hours' => 25,
            ])
            ->assertSessionHasErrors('hours');
    }

    #[Test]
    public function member_without_edit_tasks_cannot_log_hours(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['view_tasks']);

        $this->actingAs($member)
            ->patch("/projects/{$this->project->id}/tasks/{$this->task->id}/log-hours", [
                'hours' => 2,
            ])
            ->assertForbidden();
    }
}
