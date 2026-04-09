<?php

namespace Modules\Project\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Modules\Project\Contracts\ProjectServiceInterface;
use Modules\Project\Models\Project;
use Modules\Project\Notifications\ProjectStatusChangedNotification;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProjectServiceNotificationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function updating_project_status_notifies_owner_and_team_members(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $owner->id,
            'status' => 'active',
        ]);
        $project->team()->attach($member->id, [
            'permissions' => json_encode(['view_project', 'view_tasks']),
            'allocation' => 100,
        ]);

        $this->actingAs($actor);

        app(ProjectServiceInterface::class)->updateProject($project->id, [
            'name' => $project->name,
            'status' => 'on_hold',
        ]);

        Notification::assertSentTo($owner, ProjectStatusChangedNotification::class);
        Notification::assertSentTo($member, ProjectStatusChangedNotification::class);
    }

    #[Test]
    public function updating_project_status_does_not_notify_the_actor(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $actor->id,
            'status' => 'active',
        ]);

        $this->actingAs($actor);

        app(ProjectServiceInterface::class)->updateProject($project->id, [
            'name' => $project->name,
            'status' => 'completed',
        ]);

        Notification::assertNotSentTo($actor, ProjectStatusChangedNotification::class);
    }

    #[Test]
    public function updating_project_without_status_change_does_not_send_status_notification(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $owner = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $owner->id,
            'status' => 'active',
        ]);

        $this->actingAs($actor);

        app(ProjectServiceInterface::class)->updateProject($project->id, [
            'name' => 'Nový názov projektu',
            'status' => 'active',
        ]);

        Notification::assertNotSentTo($owner, ProjectStatusChangedNotification::class);
    }

    #[Test]
    public function status_changed_notification_contains_correct_old_and_new_status(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $owner = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $owner->id,
            'status' => 'active',
        ]);

        $this->actingAs($actor);

        app(ProjectServiceInterface::class)->updateProject($project->id, [
            'name' => $project->name,
            'status' => 'completed',
        ]);

        Notification::assertSentTo(
            $owner,
            ProjectStatusChangedNotification::class,
            function (ProjectStatusChangedNotification $notification) {
                $data = $notification->toArray();
                return $data['old_status'] === 'active'
                    && $data['new_status'] === 'completed';
            }
        );
    }
}
