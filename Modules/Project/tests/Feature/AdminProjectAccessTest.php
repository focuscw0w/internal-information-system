<?php

namespace Modules\Project\Tests\Feature;

use App\Enums\PermissionEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Enums\ProjectPermission;
use Modules\Project\Models\Project;
use Modules\User\Models\User;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AdminProjectAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (PermissionEnum::all() as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function createAdmin(): User
    {
        $admin = User::factory()->create();
        $admin->syncPermissions(PermissionEnum::all());

        return $admin;
    }

    private function createProject(?User $owner = null): Project
    {
        $owner ??= User::factory()->create();

        return Project::factory()->create([
            'owner_id' => $owner->id,
            'name' => 'Test projekt',
            'status' => 'active',
            'start_date' => now(),
            'end_date' => now()->addMonth(),
        ]);
    }

    // =========================================================================
    // ADMIN – PROJECT ACCESS (not in team, not owner)
    // =========================================================================

    public function test_admin_can_view_project_without_being_in_team(): void
    {
        $admin = $this->createAdmin();
        $project = $this->createProject();

        $this->actingAs($admin)
            ->get("/projects/{$project->id}")
            ->assertOk();
    }

    public function test_admin_can_update_project_without_being_in_team(): void
    {
        $admin = $this->createAdmin();
        $project = $this->createProject();

        $this->actingAs($admin)
            ->put("/projects/{$project->id}", [
                'name' => 'Admin upravil',
                'status' => 'active',
                'workload' => 'medium',
                'start_date' => now()->format('Y-m-d'),
                'end_date' => now()->addMonth()->format('Y-m-d'),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('projects', ['id' => $project->id, 'name' => 'Admin upravil']);
    }

    public function test_admin_can_delete_project_without_being_in_team(): void
    {
        $admin = $this->createAdmin();
        $project = $this->createProject();

        $this->actingAs($admin)
            ->delete("/projects/{$project->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    // =========================================================================
    // ADMIN – TEAM MANAGEMENT
    // =========================================================================

    public function test_admin_can_manage_team_without_being_in_team(): void
    {
        $admin = $this->createAdmin();
        $project = $this->createProject();
        $newMember = User::factory()->create();

        $this->actingAs($admin)
            ->put("/projects/{$project->id}/team", [
                'team_members' => [$newMember->id],
                'team_settings' => [
                    $newMember->id => [
                        'permissions' => [ProjectPermission::VIEW_PROJECT->value],
                        'allocation' => 100,
                    ],
                ],
            ])
            ->assertRedirect();
    }

    public function test_admin_can_remove_team_member(): void
    {
        $admin = $this->createAdmin();
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProject($owner);

        $project->team()->attach($member->id, [
            'permissions' => json_encode([ProjectPermission::VIEW_PROJECT->value]),
            'allocation' => 100,
        ]);

        $this->actingAs($admin)
            ->delete("/projects/{$project->id}/team/{$member->id}", [
                'team_members' => [],
                'team_settings' => [],
            ])
            ->assertRedirect();
    }

    // =========================================================================
    // ADMIN – TASK ACCESS
    // =========================================================================

    public function test_admin_can_create_task_without_being_in_team(): void
    {
        $admin = $this->createAdmin();
        $project = $this->createProject();

        $this->actingAs($admin)
            ->post("/projects/{$project->id}/tasks", [
                'title' => 'Admin task',
                'status' => 'todo',
                'priority' => 'medium',
                'estimated_hours' => 4,
                'due_date' => now()->addWeek()->format('Y-m-d'),
            ])
            ->assertRedirect();
    }

    // =========================================================================
    // ADMIN – PROJECT LIST
    // =========================================================================

    public function test_admin_sees_all_projects_in_list(): void
    {
        $admin = $this->createAdmin();
        $owner1 = User::factory()->create();
        $owner2 = User::factory()->create();

        $project1 = Project::factory()->create([
            'owner_id' => $owner1->id,
            'name' => 'Projekt A',
            'status' => 'active',
            'start_date' => now(),
            'end_date' => now()->addMonth(),
        ]);

        $project2 = Project::factory()->create([
            'owner_id' => $owner2->id,
            'name' => 'Projekt B',
            'status' => 'active',
            'start_date' => now(),
            'end_date' => now()->addMonth(),
        ]);

        $response = $this->actingAs($admin)
            ->get('/projects')
            ->assertOk();

        $response->assertSee('Projekt A');
        $response->assertSee('Projekt B');
    }

    // =========================================================================
    // ADMIN – GETS ALL PERMISSIONS VIA RESOURCE
    // =========================================================================

    public function test_admin_gets_all_project_permissions_in_response(): void
    {
        $admin = $this->createAdmin();
        $project = $this->createProject();

        $response = $this->actingAs($admin)
            ->get("/projects/{$project->id}")
            ->assertOk();

        $page = $response->original->getData()['page'];
        $projectData = $page['props']['project'];

        $this->assertEquals(
            ProjectPermission::allValues(),
            $projectData['current_user_permissions'],
            'Admin by mal dostať všetky projektové permissions v response'
        );
    }

    // =========================================================================
    // CONTROL – user without projects.view_all still gets 403
    // =========================================================================

    public function test_regular_user_without_global_permission_still_gets_403(): void
    {
        $regularUser = User::factory()->create();
        $project = $this->createProject();

        $this->actingAs($regularUser)
            ->get("/projects/{$project->id}")
            ->assertForbidden();
    }

    public function test_user_with_only_projects_create_cannot_view_others_projects(): void
    {
        foreach (PermissionEnum::all() as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $user = User::factory()->create();
        $user->givePermissionTo(PermissionEnum::PROJECTS_CREATE->value);

        $project = $this->createProject();

        $this->actingAs($user)
            ->get("/projects/{$project->id}")
            ->assertForbidden();
    }
}
