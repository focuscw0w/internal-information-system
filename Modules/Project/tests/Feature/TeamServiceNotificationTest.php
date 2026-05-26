<?php

namespace Modules\Project\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Modules\Project\Contracts\TeamServiceInterface;
use Modules\Project\Models\Project;
use Modules\Project\Notifications\ProjectAssignedNotification;
use Modules\Project\Notifications\ProjectHighPriorityNotification;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TeamServiceNotificationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function adding_member_to_high_priority_project_sends_both_assigned_and_high_priority_notifications(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $newMember = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $actor->id,
            'priority' => 'high',
        ]);

        $this->actingAs($actor);

        app(TeamServiceInterface::class)->updateProjectTeam($project->id, [
            'team_members' => [$newMember->id],
            'team_settings' => [],
        ]);

        Notification::assertSentTo($newMember, ProjectAssignedNotification::class);
        Notification::assertSentTo($newMember, ProjectHighPriorityNotification::class);
    }

    #[Test]
    public function adding_member_to_urgent_project_sends_high_priority_notification(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $newMember = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $actor->id,
            'priority' => 'urgent',
        ]);

        $this->actingAs($actor);

        app(TeamServiceInterface::class)->updateProjectTeam($project->id, [
            'team_members' => [$newMember->id],
            'team_settings' => [],
        ]);

        Notification::assertSentTo($newMember, ProjectHighPriorityNotification::class);
    }

    #[Test]
    public function adding_member_to_low_priority_project_does_not_send_high_priority_notification(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $newMember = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $actor->id,
            'priority' => 'low',
        ]);

        $this->actingAs($actor);

        app(TeamServiceInterface::class)->updateProjectTeam($project->id, [
            'team_members' => [$newMember->id],
            'team_settings' => [],
        ]);

        Notification::assertSentTo($newMember, ProjectAssignedNotification::class);
        Notification::assertNotSentTo($newMember, ProjectHighPriorityNotification::class);
    }

    #[Test]
    public function adding_member_to_medium_priority_project_does_not_send_high_priority_notification(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $newMember = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $actor->id,
            'priority' => 'medium',
        ]);

        $this->actingAs($actor);

        app(TeamServiceInterface::class)->updateProjectTeam($project->id, [
            'team_members' => [$newMember->id],
            'team_settings' => [],
        ]);

        Notification::assertNotSentTo($newMember, ProjectHighPriorityNotification::class);
    }

    #[Test]
    public function assigner_does_not_receive_high_priority_notification_for_their_own_addition(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $actor->id,
            'priority' => 'urgent',
        ]);

        $this->actingAs($actor);

        app(TeamServiceInterface::class)->updateProjectTeam($project->id, [
            'team_members' => [$actor->id],
            'team_settings' => [],
        ]);

        Notification::assertNotSentTo($actor, ProjectHighPriorityNotification::class);
    }
}
