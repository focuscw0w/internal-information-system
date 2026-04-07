<?php

namespace Modules\Project\Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\Project\Contracts\TeamServiceInterface;
use Modules\Project\Notifications\DeadlineApproachingNotification;
use Modules\Project\Notifications\ProjectAssignedNotification;
use Modules\Project\Notifications\TaskAssignedNotification;
use Modules\Project\Notifications\TaskStatusChangedNotification;
use Modules\Project\Services\NotificationService;
use Modules\Project\Services\TaskService;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    private NotificationService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new NotificationService();
    }

    #[Test]
    public function it_notifies_new_task_assignees_except_the_assigning_user(): void
    {
        Notification::fake();

        $assignedBy = User::factory()->create();
        $assignee = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $assignedBy->id]);
        $task = Task::factory()->create(['project_id' => $project->id]);

        $this->service->notifyTaskAssigned($task, [$assignee->id, $assignedBy->id], $assignedBy);

        Notification::assertSentTo($assignee, TaskAssignedNotification::class);
        Notification::assertNotSentTo($assignedBy, TaskAssignedNotification::class);
    }

    #[Test]
    public function it_notifies_new_project_members_except_the_assigning_user(): void
    {
        Notification::fake();

        $assignedBy = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $assignedBy->id]);

        $this->service->notifyProjectAssigned($project, [$member->id, $assignedBy->id], $assignedBy);

        Notification::assertSentTo($member, ProjectAssignedNotification::class);
        Notification::assertNotSentTo($assignedBy, ProjectAssignedNotification::class);
    }

    #[Test]
    public function it_notifies_task_status_recipients_without_notifying_the_actor(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'status' => 'todo']);
        $task->assignedUsers()->attach([$assignee->id, $actor->id]);

        $this->actingAs($actor);

        $this->service->notifyTaskStatusChanged($task, 'todo', 'in_progress');

        Notification::assertSentTo($owner, TaskStatusChangedNotification::class);
        Notification::assertSentTo($assignee, TaskStatusChangedNotification::class);
        Notification::assertNotSentTo($actor, TaskStatusChangedNotification::class);
    }

    #[Test]
    public function it_does_not_send_duplicate_deadline_notifications_within_24_hours(): void
    {
        $owner = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $task = Task::factory()->create(['project_id' => $project->id]);

        $owner->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => DeadlineApproachingNotification::class,
            'data' => [
                'task_id' => $task->id,
                'days_remaining' => 2,
            ],
            'read_at' => null,
            'created_at' => now()->subHour(),
            'updated_at' => now()->subHour(),
        ]);

        $this->service->notifyDeadlineApproaching($task, 2);

        $this->assertSame(1, $owner->notifications()->where('type', DeadlineApproachingNotification::class)->count());
    }

    #[Test]
    public function it_marks_only_the_users_own_notification_as_read(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $notification = $this->createDatabaseNotification($user);
        $otherNotification = $this->createDatabaseNotification($otherUser);

        $this->assertTrue($this->service->markAsRead($notification->id, $user));
        $this->assertFalse($this->service->markAsRead($otherNotification->id, $user));

        $this->assertNotNull($notification->fresh()->read_at);
        $this->assertNull($otherNotification->fresh()->read_at);
    }

    #[Test]
    public function it_marks_all_unread_notifications_for_a_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->createDatabaseNotification($user);
        $this->createDatabaseNotification($user);
        $this->createDatabaseNotification($user, now()->subDay());
        $this->createDatabaseNotification($otherUser);

        $marked = $this->service->markAllAsRead($user);

        $this->assertSame(2, $marked);
        $this->assertSame(0, $user->unreadNotifications()->count());
        $this->assertSame(1, $otherUser->unreadNotifications()->count());
    }

    #[Test]
    public function creating_a_task_notifies_initial_assignees(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $assignee = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $actor->id]);

        $this->actingAs($actor);

        app(TaskService::class)->createTask($project->id, [
            'title' => 'Nová úloha',
            'description' => null,
            'priority' => 'medium',
            'estimated_hours' => 4,
            'due_date' => now()->addWeek()->toDateString(),
            'assigned_users' => [$assignee->id],
        ]);

        Notification::assertSentTo($assignee, TaskAssignedNotification::class);
    }

    #[Test]
    public function updating_a_task_notifies_only_new_assignees(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $existingAssignee = User::factory()->create();
        $newAssignee = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $actor->id]);
        $task = Task::factory()->create(['project_id' => $project->id]);
        $task->assignedUsers()->attach($existingAssignee->id);

        $this->actingAs($actor);

        app(TaskService::class)->updateTask($task->id, [
            'assigned_users' => [$existingAssignee->id, $newAssignee->id],
        ]);

        Notification::assertSentTo($newAssignee, TaskAssignedNotification::class);
        Notification::assertNotSentTo($existingAssignee, TaskAssignedNotification::class);
    }

    #[Test]
    public function updating_project_team_notifies_only_new_members(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $existingMember = User::factory()->create();
        $newMember = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $actor->id]);
        $project->team()->attach($existingMember->id, [
            'permissions' => json_encode(['view_project', 'view_tasks']),
            'allocation' => 100,
        ]);

        $this->actingAs($actor);

        app(TeamServiceInterface::class)->updateProjectTeam($project->id, [
            'team_members' => [$existingMember->id, $newMember->id],
            'team_settings' => [
                $existingMember->id => [
                    'permissions' => ['view_project', 'view_tasks'],
                    'allocation' => 100,
                ],
                $newMember->id => [
                    'permissions' => ['view_project', 'view_tasks'],
                    'allocation' => 100,
                ],
            ],
        ]);

        Notification::assertSentTo($newMember, ProjectAssignedNotification::class);
        Notification::assertNotSentTo($existingMember, ProjectAssignedNotification::class);
    }

    private function createDatabaseNotification(User $user, mixed $readAt = null): mixed
    {
        return $user->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => TaskAssignedNotification::class,
            'data' => [
                'type' => 'task_assigned',
                'title' => 'Priradenie úlohy',
                'message' => 'Test notifikácia',
                'project_id' => 1,
                'project_name' => 'Test projekt',
                'task_id' => 1,
                'task_title' => 'Test úloha',
                'url' => '/projects/1/tasks/1',
                'priority' => 'medium',
            ],
            'read_at' => $readAt,
        ]);
    }
}
