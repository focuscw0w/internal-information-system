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
use Modules\Project\Notifications\ProjectCapacityAtRiskNotification;
use Modules\Project\Notifications\ProjectHighPriorityNotification;
use Modules\Project\Notifications\ProjectStatusChangedNotification;
use Modules\Project\Notifications\PasswordResetRequestedNotification;
use Modules\Project\Notifications\TaskAssignedNotification;
use Modules\Project\Notifications\TaskHoursExceededNotification;
use Modules\Project\Notifications\TaskStatusChangedNotification;
use Modules\Project\Notifications\UserOverloadedNotification;
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

        $this->service = app(NotificationService::class);
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

    // ── notifyUserOverloaded ──────────────────────────────────────────────────

    #[Test]
    public function it_sends_user_overloaded_notification_to_the_user(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->service->notifyUserOverloaded($user, 115.5);

        Notification::assertSentTo($user, UserOverloadedNotification::class);
    }

    #[Test]
    public function it_does_not_send_duplicate_user_overloaded_notification_within_24_hours(): void
    {
        $user = User::factory()->create();

        $user->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => UserOverloadedNotification::class,
            'data' => ['type' => 'user_overloaded'],
            'read_at' => null,
            'created_at' => now()->subHour(),
            'updated_at' => now()->subHour(),
        ]);

        $this->service->notifyUserOverloaded($user, 120.0);

        $this->assertSame(1, $user->notifications()->where('type', UserOverloadedNotification::class)->count());
    }

    #[Test]
    public function it_sends_user_overloaded_again_after_24_hours(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $user->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => UserOverloadedNotification::class,
            'data' => ['type' => 'user_overloaded'],
            'read_at' => null,
            'created_at' => now()->subHours(25),
            'updated_at' => now()->subHours(25),
        ]);

        $this->service->notifyUserOverloaded($user, 110.0);

        Notification::assertSentTo($user, UserOverloadedNotification::class);
    }

    // ── notifyProjectCapacityAtRisk ───────────────────────────────────────────

    #[Test]
    public function it_sends_project_capacity_at_risk_to_owner_and_team(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->team()->attach($member->id, [
            'permissions' => json_encode(['view_project', 'view_tasks']),
            'allocation' => 100,
        ]);

        $this->service->notifyProjectCapacityAtRisk($project, 80.0, 45.0);

        Notification::assertSentTo($owner, ProjectCapacityAtRiskNotification::class);
        Notification::assertSentTo($member, ProjectCapacityAtRiskNotification::class);
    }

    #[Test]
    public function it_does_not_send_duplicate_project_capacity_at_risk_within_24_hours(): void
    {
        $owner = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);

        $owner->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => ProjectCapacityAtRiskNotification::class,
            'data' => ['project_id' => $project->id],
            'read_at' => null,
            'created_at' => now()->subHour(),
            'updated_at' => now()->subHour(),
        ]);

        $this->service->notifyProjectCapacityAtRisk($project, 80.0, 45.0);

        $this->assertSame(1, $owner->notifications()->where('type', ProjectCapacityAtRiskNotification::class)->count());
    }

    // ── notifyProjectHighPriority ─────────────────────────────────────────────

    #[Test]
    public function it_sends_project_high_priority_to_new_members_except_assigner(): void
    {
        Notification::fake();

        $assignedBy = User::factory()->create();
        $newMember = User::factory()->create();
        $project = Project::factory()->create(['priority' => 'high']);

        $this->service->notifyProjectHighPriority($project, [$newMember->id, $assignedBy->id], $assignedBy);

        Notification::assertSentTo($newMember, ProjectHighPriorityNotification::class);
        Notification::assertNotSentTo($assignedBy, ProjectHighPriorityNotification::class);
    }

    #[Test]
    public function it_does_not_send_project_high_priority_when_user_ids_empty(): void
    {
        Notification::fake();

        $assignedBy = User::factory()->create();
        $project = Project::factory()->create(['priority' => 'high']);

        $this->service->notifyProjectHighPriority($project, [], $assignedBy);

        Notification::assertNothingSent();
    }

    // ── notifyTaskHoursExceeded ───────────────────────────────────────────────

    #[Test]
    public function it_sends_task_hours_exceeded_to_assignees_and_owner(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'estimated_hours' => 5,
            'actual_hours' => 7,
        ]);
        $task->assignedUsers()->attach($assignee->id);

        $this->service->notifyTaskHoursExceeded($task);

        Notification::assertSentTo($owner, TaskHoursExceededNotification::class);
        Notification::assertSentTo($assignee, TaskHoursExceededNotification::class);
    }

    #[Test]
    public function it_does_not_send_duplicate_task_hours_exceeded_within_24_hours(): void
    {
        $owner = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'estimated_hours' => 5,
            'actual_hours' => 7,
        ]);

        $owner->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => TaskHoursExceededNotification::class,
            'data' => ['task_id' => $task->id],
            'read_at' => null,
            'created_at' => now()->subHour(),
            'updated_at' => now()->subHour(),
        ]);

        $this->service->notifyTaskHoursExceeded($task);

        $this->assertSame(1, $owner->notifications()->where('type', TaskHoursExceededNotification::class)->count());
    }

    // ── notifyProjectStatusChanged ────────────────────────────────────────────

    #[Test]
    public function it_sends_project_status_changed_to_owner_and_team_excluding_actor(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->team()->attach($member->id, [
            'permissions' => json_encode(['view_project', 'view_tasks']),
            'allocation' => 100,
        ]);

        $this->service->notifyProjectStatusChanged($project, 'active', 'on_hold', $actor);

        Notification::assertSentTo($owner, ProjectStatusChangedNotification::class);
        Notification::assertSentTo($member, ProjectStatusChangedNotification::class);
        Notification::assertNotSentTo($actor, ProjectStatusChangedNotification::class);
    }

    #[Test]
    public function it_excludes_owner_from_project_status_changed_when_owner_is_the_actor(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->team()->attach($member->id, [
            'permissions' => json_encode(['view_project', 'view_tasks']),
            'allocation' => 100,
        ]);

        $this->service->notifyProjectStatusChanged($project, 'active', 'completed', $owner);

        Notification::assertNotSentTo($owner, ProjectStatusChangedNotification::class);
        Notification::assertSentTo($member, ProjectStatusChangedNotification::class);
    }

    // ── notifyPasswordResetRequested ─────────────────────────────────────────

    #[Test]
    public function it_notifies_all_admins_when_a_user_requests_password_reset(): void
    {
        Notification::fake();

        $admin1 = User::factory()->create(['is_admin' => true]);
        $admin2 = User::factory()->create(['is_admin' => true]);
        $requestingUser = User::factory()->create(['is_admin' => false]);

        $this->service->notifyPasswordResetRequested($requestingUser);

        Notification::assertSentTo($admin1, PasswordResetRequestedNotification::class);
        Notification::assertSentTo($admin2, PasswordResetRequestedNotification::class);
    }

    #[Test]
    public function it_does_not_notify_regular_users_on_password_reset_request(): void
    {
        Notification::fake();

        $admin = User::factory()->create(['is_admin' => true]);
        $regularUser = User::factory()->create(['is_admin' => false]);
        $requestingUser = User::factory()->create(['is_admin' => false]);

        $this->service->notifyPasswordResetRequested($requestingUser);

        Notification::assertNotSentTo($regularUser, PasswordResetRequestedNotification::class);
        Notification::assertSentTo($admin, PasswordResetRequestedNotification::class);
    }

    #[Test]
    public function password_reset_notification_contains_correct_data(): void
    {
        Notification::fake();

        $admin = User::factory()->create(['is_admin' => true]);
        $requestingUser = User::factory()->create(['is_admin' => false]);

        $this->service->notifyPasswordResetRequested($requestingUser);

        Notification::assertSentTo(
            $admin,
            PasswordResetRequestedNotification::class,
            function (PasswordResetRequestedNotification $notification) use ($requestingUser) {
                $data = $notification->toArray();

                return $data['type'] === 'password_reset_requested'
                    && $data['user_id'] === $requestingUser->id
                    && $data['url'] === "/users?edit={$requestingUser->id}"
                    && $data['priority'] === 'high';
            }
        );
    }

    #[Test]
    public function it_notifies_admin_even_when_requesting_user_is_also_admin(): void
    {
        Notification::fake();

        $admin = User::factory()->create(['is_admin' => true]);
        $requestingAdmin = User::factory()->create(['is_admin' => true]);

        $this->service->notifyPasswordResetRequested($requestingAdmin);

        Notification::assertSentTo($admin, PasswordResetRequestedNotification::class);
        Notification::assertSentTo($requestingAdmin, PasswordResetRequestedNotification::class);
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
