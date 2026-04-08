<?php

namespace Modules\Project\Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\Project\Notifications\TaskAssignedNotification;
use Modules\Project\Services\ActivityLogService;
use Modules\Project\Services\NotificationService;
use Modules\Project\Services\TaskService;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TaskServiceTest extends TestCase
{
    use RefreshDatabase;

    private TaskService $service;
    private User $actor;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actor = User::factory()->create();
        $this->project = Project::factory()->create(['owner_id' => $this->actor->id]);
        $this->service = new TaskService(new ActivityLogService(), new NotificationService());

        $this->actingAs($this->actor);
    }

    // =========================================================================
    // createTask
    // =========================================================================

    #[Test]
    public function it_creates_a_task_with_required_fields(): void
    {
        $task = $this->service->createTask($this->project->id, [
            'title' => 'Nová úloha',
            'priority' => 'high',
            'status' => 'todo',
            'estimated_hours' => 4,
            'due_date' => now()->addWeek()->toDateString(),
        ]);

        $this->assertInstanceOf(Task::class, $task);
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'Nová úloha',
            'project_id' => $this->project->id,
            'status' => 'todo',
        ]);
    }

    #[Test]
    public function it_increments_project_tasks_total_when_task_is_created(): void
    {
        $this->assertEquals(0, $this->project->tasks_total);

        $this->service->createTask($this->project->id, [
            'title' => 'Úloha',
            'priority' => 'medium',
            'status' => 'todo',
            'estimated_hours' => 2,
            'due_date' => now()->addWeek()->toDateString(),
        ]);

        $this->assertEquals(1, $this->project->fresh()->tasks_total);
    }

    #[Test]
    public function it_syncs_assigned_users_when_provided(): void
    {
        $assignee = User::factory()->create();

        $task = $this->service->createTask($this->project->id, [
            'title' => 'Úloha s používateľom',
            'priority' => 'low',
            'status' => 'todo',
            'estimated_hours' => 1,
            'due_date' => now()->addWeek()->toDateString(),
            'assigned_users' => [$assignee->id],
        ]);

        $this->assertDatabaseHas('assigned_users', [
            'task_id' => $task->id,
            'user_id' => $assignee->id,
        ]);
    }

    #[Test]
    public function it_sends_task_assigned_notification_when_assigned_users_provided(): void
    {
        Notification::fake();

        $assignee = User::factory()->create();

        $this->service->createTask($this->project->id, [
            'title' => 'Notifikačná úloha',
            'priority' => 'medium',
            'status' => 'todo',
            'estimated_hours' => 2,
            'due_date' => now()->addWeek()->toDateString(),
            'assigned_users' => [$assignee->id],
        ]);

        Notification::assertSentTo($assignee, TaskAssignedNotification::class);
    }

    #[Test]
    public function it_does_not_send_notification_when_no_assigned_users(): void
    {
        Notification::fake();

        $this->service->createTask($this->project->id, [
            'title' => 'Úloha bez priradenia',
            'priority' => 'medium',
            'status' => 'todo',
            'estimated_hours' => 2,
            'due_date' => now()->addWeek()->toDateString(),
        ]);

        Notification::assertNothingSent();
    }

    // =========================================================================
    // updateTask
    // =========================================================================

    #[Test]
    public function it_updates_task_fields(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'title' => 'Pôvodný názov',
            'priority' => 'low',
        ]);

        $this->service->updateTask($task->id, [
            'title' => 'Nový názov',
            'priority' => 'high',
        ]);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'Nový názov',
            'priority' => 'high',
        ]);
    }

    #[Test]
    public function it_logs_activity_when_fields_change(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'title' => 'Stará',
        ]);

        $this->service->updateTask($task->id, ['title' => 'Nová']);

        $this->assertDatabaseHas('activity_log', [
            'project_id' => $this->project->id,
            'type' => 'task_updated',
        ]);
    }

    #[Test]
    public function it_does_not_log_activity_when_nothing_changes(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'title' => 'Rovnaký',
            'priority' => 'medium',
        ]);

        $this->service->updateTask($task->id, ['title' => 'Rovnaký']);

        $this->assertDatabaseMissing('activity_log', [
            'project_id' => $this->project->id,
            'type' => 'task_updated',
        ]);
    }

    #[Test]
    public function it_notifies_only_newly_added_assignees_on_update(): void
    {
        Notification::fake();

        $existingAssignee = User::factory()->create();
        $newAssignee = User::factory()->create();

        $task = Task::factory()->create(['project_id' => $this->project->id]);
        $task->assignedUsers()->attach($existingAssignee->id);

        $this->service->updateTask($task->id, [
            'assigned_users' => [$existingAssignee->id, $newAssignee->id],
        ]);

        Notification::assertSentTo($newAssignee, TaskAssignedNotification::class);
        Notification::assertNotSentTo($existingAssignee, TaskAssignedNotification::class);
    }

    // =========================================================================
    // deleteTask
    // =========================================================================

    #[Test]
    public function it_soft_deletes_a_task(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id]);

        $this->service->deleteTask($task->id);

        $this->assertSoftDeleted('tasks', ['id' => $task->id]);
    }

    #[Test]
    public function it_decrements_project_tasks_total_on_delete(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id]);
        $this->assertEquals(1, $this->project->fresh()->tasks_total);

        $this->service->deleteTask($task->id);

        $this->assertEquals(0, $this->project->fresh()->tasks_total);
    }

    #[Test]
    public function it_logs_activity_on_task_delete(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id]);

        $this->service->deleteTask($task->id);

        $this->assertDatabaseHas('activity_log', [
            'project_id' => $this->project->id,
            'type' => 'task_deleted',
        ]);
    }

    // =========================================================================
    // assignTask
    // =========================================================================

    #[Test]
    public function it_syncs_pivot_with_new_user_ids(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $task = Task::factory()->create(['project_id' => $this->project->id]);
        $task->assignedUsers()->attach($user1->id);

        $this->service->assignTask($task->id, [$user2->id]);

        $this->assertDatabaseHas('assigned_users', ['task_id' => $task->id, 'user_id' => $user2->id]);
        $this->assertDatabaseMissing('assigned_users', ['task_id' => $task->id, 'user_id' => $user1->id]);
    }

    #[Test]
    public function it_notifies_only_new_users_on_assign(): void
    {
        Notification::fake();

        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $task = Task::factory()->create(['project_id' => $this->project->id]);
        $task->assignedUsers()->attach($user1->id);

        $this->service->assignTask($task->id, [$user1->id, $user2->id]);

        Notification::assertSentTo($user2, TaskAssignedNotification::class);
        Notification::assertNotSentTo($user1, TaskAssignedNotification::class);
    }

    // =========================================================================
    // updateTaskStatus
    // =========================================================================

    #[Test]
    public function it_updates_task_status(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'todo',
        ]);

        $this->service->updateTaskStatus($task->id, 'in_progress');

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'status' => 'in_progress']);
    }

    #[Test]
    public function it_logs_activity_on_status_change(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'todo',
        ]);

        $this->service->updateTaskStatus($task->id, 'done');

        $this->assertDatabaseHas('activity_log', [
            'project_id' => $this->project->id,
            'type' => 'task_status_changed',
        ]);
    }

    // =========================================================================
    // logHours
    // =========================================================================

    #[Test]
    public function it_increments_actual_hours(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'actual_hours' => 0,
        ]);

        $this->service->logHours($task->id, 3);

        $this->assertEquals(3, $task->fresh()->actual_hours);
    }

    #[Test]
    public function it_accumulates_hours_across_multiple_calls(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'actual_hours' => 0,
        ]);

        $this->service->logHours($task->id, 3);
        $this->service->logHours($task->id, 2);

        $this->assertEquals(5, $task->fresh()->actual_hours);
    }
}
