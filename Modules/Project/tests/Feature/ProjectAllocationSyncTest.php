<?php

namespace Modules\Project\Tests\Feature;

use Modules\CapacityManagement\Enums\CapacityPermission;
use Modules\Project\Enums\ProjectGlobalPermission;
use Modules\User\Contracts\PermissionRegistryInterface;
use Modules\User\Enums\UserPermission;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\CapacityManagement\Models\EmployeeCapacity;
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
        EmployeeCapacity::create(['user_id' => $member->id, 'weekly_capacity_hours' => 40]);
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
            'allocated_hours' => 103,
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
        EmployeeCapacity::create(['user_id' => $member->id, 'weekly_capacity_hours' => 40]);
        $project = Project::factory()->create([
            'owner_id' => $owner->id,
            'name' => 'Sync test',
            'status' => 'active',
            'priority' => 'medium',
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
                'priority' => 'medium',
                'start_date' => '2026-05-01',
                'end_date' => '2026-05-31',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('project_allocations', [
            'project_id' => $project->id,
            'user_id' => $member->id,
            'allocated_hours' => 89,
            'percentage' => 50,
            'start_date' => '2026-05-01 00:00:00',
            'end_date' => '2026-05-31 00:00:00',
        ]);
    }

    #[Test]
    public function project_creation_with_team_creates_project_allocations(): void
    {
        $owner = User::factory()->create();
        $owner->givePermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value);
        $member = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $member->id, 'weekly_capacity_hours' => 32]);

        $this->actingAs($owner)
            ->post('/projects', [
                'name' => 'Allocation on create',
                'description' => 'Test project',
                'status' => 'active',
                'priority' => 'medium',
                'start_date' => '2026-04-01',
                'end_date' => '2026-04-14',
                'team_members' => [$member->id],
                'team_settings' => [
                    $member->id => [
                        'permissions' => [ProjectPermission::VIEW_PROJECT->value],
                        'allocation' => 50,
                    ],
                ],
            ])
            ->assertRedirect(route('projects.projects'));

        $project = Project::query()->where('name', 'Allocation on create')->firstOrFail();

        $this->assertDatabaseHas('project_allocations', [
            'project_id' => $project->id,
            'user_id' => $member->id,
            'allocated_hours' => 32,
            'percentage' => 50,
            'start_date' => '2026-04-01 00:00:00',
            'end_date' => '2026-04-14 00:00:00',
        ]);
    }

    #[Test]
    public function syncing_project_allocations_command_recomputes_existing_records(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $member->id, 'weekly_capacity_hours' => 40]);

        $project = Project::factory()->create([
            'owner_id' => $owner->id,
            'status' => 'active',
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-30',
        ]);

        $project->team()->attach($member->id, [
            'permissions' => json_encode([ProjectPermission::VIEW_PROJECT->value]),
            'allocation' => 50,
        ]);

        $this->artisan('project:sync-allocations')
            ->assertExitCode(0);

        $this->assertDatabaseHas('project_allocations', [
            'project_id' => $project->id,
            'user_id' => $member->id,
            'allocated_hours' => 86,
            'percentage' => 50,
        ]);
    }
}
