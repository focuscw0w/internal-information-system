<?php

namespace Modules\Project\Tests\Feature;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Enums\ProjectPermission;
use Modules\Project\Models\Project;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProjectAllocationSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(PermissionSeeder::class);
    }

    #[Test]
    public function team_updates_create_update_and_remove_project_allocations(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $owner->id,
            'status' => 'active',
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-30',
        ]);

        $this->actingAs($owner)
            ->put("/projects/{$project->id}/team", [
                'team_members' => [$member->id],
                'team_settings' => [
                    $member->id => [
                        'permissions' => [ProjectPermission::VIEW_PROJECT->value],
                        'allocation' => 60,
                    ],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('project_allocations', [
            'project_id' => $project->id,
            'user_id' => $member->id,
            'allocated_hours' => 0,
            'used_hours' => 0,
            'percentage' => 60,
            'start_date' => '2026-04-01 00:00:00',
            'end_date' => '2026-04-30 00:00:00',
        ]);

        $this->actingAs($owner)
            ->put("/projects/{$project->id}/team", [
                'team_members' => [$member->id],
                'team_settings' => [
                    $member->id => [
                        'permissions' => [ProjectPermission::VIEW_PROJECT->value],
                        'allocation' => 80,
                    ],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('project_allocations', 1);
        $this->assertDatabaseHas('project_allocations', [
            'project_id' => $project->id,
            'user_id' => $member->id,
            'percentage' => 80,
        ]);

        $this->actingAs($owner)
            ->put("/projects/{$project->id}/team", [
                'team_members' => [],
                'team_settings' => [],
            ])
            ->assertRedirect();

        $this->assertDatabaseMissing('project_allocations', [
            'project_id' => $project->id,
            'user_id' => $member->id,
        ]);
    }

    #[Test]
    public function project_date_updates_resync_existing_team_allocations(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $owner->id,
            'name' => 'Sync test',
            'status' => 'active',
            'workload' => 'medium',
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-30',
        ]);

        $project->team()->attach($member->id, [
            'permissions' => json_encode([ProjectPermission::VIEW_PROJECT->value]),
            'allocation' => 50,
        ]);

        $this->actingAs($owner)
            ->put("/projects/{$project->id}", [
                'name' => 'Sync test',
                'status' => 'active',
                'workload' => 'medium',
                'start_date' => '2026-05-01',
                'end_date' => '2026-05-31',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('project_allocations', [
            'project_id' => $project->id,
            'user_id' => $member->id,
            'percentage' => 50,
            'start_date' => '2026-05-01 00:00:00',
            'end_date' => '2026-05-31 00:00:00',
        ]);
    }
}
