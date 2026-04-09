<?php

namespace Modules\Project\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Modules\Project\Contracts\TeamServiceInterface;
use Modules\Project\Models\Project;
use Modules\Project\Notifications\ProjectAssignedNotification;
use Modules\Project\Notifications\ProjectHighWorkloadNotification;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TeamServiceNotificationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function adding_member_to_high_workload_project_sends_both_assigned_and_high_workload_notifications(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $newMember = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $actor->id,
            'workload' => 'high',
        ]);

        $this->actingAs($actor);

        app(TeamServiceInterface::class)->updateProjectTeam($project->id, [
            'team_members' => [$newMember->id],
            'team_settings' => [],
        ]);

        Notification::assertSentTo($newMember, ProjectAssignedNotification::class);
        Notification::assertSentTo($newMember, ProjectHighWorkloadNotification::class);
    }

    #[Test]
    public function adding_member_to_overloaded_project_sends_high_workload_notification(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $newMember = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $actor->id,
            'workload' => 'overloaded',
        ]);

        $this->actingAs($actor);

        app(TeamServiceInterface::class)->updateProjectTeam($project->id, [
            'team_members' => [$newMember->id],
            'team_settings' => [],
        ]);

        Notification::assertSentTo($newMember, ProjectHighWorkloadNotification::class);
    }

    #[Test]
    public function adding_member_to_low_workload_project_does_not_send_high_workload_notification(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $newMember = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $actor->id,
            'workload' => 'low',
        ]);

        $this->actingAs($actor);

        app(TeamServiceInterface::class)->updateProjectTeam($project->id, [
            'team_members' => [$newMember->id],
            'team_settings' => [],
        ]);

        Notification::assertSentTo($newMember, ProjectAssignedNotification::class);
        Notification::assertNotSentTo($newMember, ProjectHighWorkloadNotification::class);
    }

    #[Test]
    public function adding_member_to_medium_workload_project_does_not_send_high_workload_notification(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $newMember = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $actor->id,
            'workload' => 'medium',
        ]);

        $this->actingAs($actor);

        app(TeamServiceInterface::class)->updateProjectTeam($project->id, [
            'team_members' => [$newMember->id],
            'team_settings' => [],
        ]);

        Notification::assertNotSentTo($newMember, ProjectHighWorkloadNotification::class);
    }

    #[Test]
    public function assigner_does_not_receive_high_workload_notification_for_their_own_addition(): void
    {
        Notification::fake();

        $actor = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $actor->id,
            'workload' => 'overloaded',
        ]);

        $this->actingAs($actor);

        app(TeamServiceInterface::class)->updateProjectTeam($project->id, [
            'team_members' => [$actor->id],
            'team_settings' => [],
        ]);

        Notification::assertNotSentTo($actor, ProjectHighWorkloadNotification::class);
    }
}
