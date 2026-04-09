<?php

namespace Modules\TimeTracking\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\Project\Notifications\TaskHoursExceededNotification;
use Modules\TimeTracking\Contracts\TimeEntryServiceInterface;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TimeEntryHoursExceededNotificationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function logging_time_that_exceeds_estimated_hours_sends_notification(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'estimated_hours' => 4,
            'actual_hours' => 0,
        ]);
        $task->assignedUsers()->attach($assignee->id);

        app(TimeEntryServiceInterface::class)->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $assignee->id,
            'entry_date' => now()->toDateString(),
            'hours' => 5,
        ]);

        Notification::assertSentTo($owner, TaskHoursExceededNotification::class);
        Notification::assertSentTo($assignee, TaskHoursExceededNotification::class);
    }

    #[Test]
    public function logging_time_that_does_not_exceed_estimated_hours_does_not_send_notification(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'estimated_hours' => 10,
            'actual_hours' => 0,
        ]);

        app(TimeEntryServiceInterface::class)->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $owner->id,
            'entry_date' => now()->toDateString(),
            'hours' => 3,
        ]);

        Notification::assertNotSentTo($owner, TaskHoursExceededNotification::class);
    }

    #[Test]
    public function task_with_no_estimated_hours_never_triggers_notification(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'estimated_hours' => null,
            'actual_hours' => 0,
        ]);

        app(TimeEntryServiceInterface::class)->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $owner->id,
            'entry_date' => now()->toDateString(),
            'hours' => 100,
        ]);

        Notification::assertNotSentTo($owner, TaskHoursExceededNotification::class);
    }

    #[Test]
    public function notification_is_not_duplicated_when_exceeding_hours_twice_within_24_hours(): void
    {
        $owner = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'estimated_hours' => 4,
            'actual_hours' => 5,
        ]);

        // Pre-seed a recent notification
        $owner->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => TaskHoursExceededNotification::class,
            'data' => ['task_id' => $task->id],
            'read_at' => null,
            'created_at' => now()->subMinutes(30),
            'updated_at' => now()->subMinutes(30),
        ]);

        // Log more time on the already-over-budget task
        app(TimeEntryServiceInterface::class)->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $owner->id,
            'entry_date' => now()->toDateString(),
            'hours' => 1,
        ]);

        $this->assertSame(
            1,
            $owner->notifications()->where('type', TaskHoursExceededNotification::class)->count()
        );
    }

    #[Test]
    public function deleting_time_entry_that_goes_below_estimate_does_not_send_notification(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'estimated_hours' => 10,
            'actual_hours' => 0,
        ]);

        $this->actingAs($owner);

        $entry = app(TimeEntryServiceInterface::class)->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $owner->id,
            'entry_date' => now()->toDateString(),
            'hours' => 8,
        ]);

        Notification::fake(); // reset

        app(TimeEntryServiceInterface::class)->delete($entry->id);

        Notification::assertNotSentTo($owner, TaskHoursExceededNotification::class);
    }
}
