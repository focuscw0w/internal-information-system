<?php

namespace Modules\Project\Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Enums\ProjectPermission;
use Modules\Project\Models\Project;
use Tests\TestCase;

class ProjectPermissionTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function createProject(?User $owner = null): Project
    {
        $owner ??= User::factory()->create();

        /** @var Project */
        return Project::factory()->create([
            'owner_id' => $owner->id,
            'name' => 'Test projekt',
            'status' => 'active',
            'start_date' => now(),
            'end_date' => now()->addMonth(),
        ]);
    }

    private function attachMember(Project $project, User $user, array $permissions): void
    {
        $project->team()->attach($user->id, [
            'permissions' => json_encode($permissions),
            'allocation' => 100,
        ]);
    }

    // =========================================================================
    // OWNER
    // =========================================================================

    public function test_owner_can_view_project(): void
    {
        $owner = User::factory()->create();
        $project = $this->createProject($owner);

        $this->actingAs($owner)
            ->get("/projects/{$project->id}")
            ->assertOk();
    }

    public function test_owner_can_update_project(): void
    {
        $owner = User::factory()->create();
        $project = $this->createProject($owner);

        $this->actingAs($owner)
            ->put("/projects/{$project->id}", [
                'name' => 'Upravený názov',
                'status' => 'active',
                'workload' => 'medium',
                'start_date' => now()->format('Y-m-d'),
                'end_date' => now()->addMonth()->format('Y-m-d'),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('projects', ['id' => $project->id, 'name' => 'Upravený názov']);
    }

    public function test_owner_can_delete_project(): void
    {
        $owner = User::factory()->create();
        $project = $this->createProject($owner);

        $this->actingAs($owner)
            ->delete("/projects/{$project->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_owner_can_manage_team(): void
    {
        $owner = User::factory()->create();
        $project = $this->createProject($owner);
        $newMember = User::factory()->create();

        $this->actingAs($owner)
            ->put("/projects/{$project->id}/team", [
                'team_members' => [$newMember->id],
                'team_settings' => [
                    $newMember->id => [
                        'permissions' => [ProjectPermission::VIEW_PROJECT->value],
                        'allocation' => 50,
                    ],
                ],
            ])
            ->assertRedirect();
    }

    public function test_owner_has_all_permissions_via_model(): void
    {
        $owner = User::factory()->create();
        $project = $this->createProject($owner);

        foreach (ProjectPermission::cases() as $permission) {
            $this->assertTrue(
                $project->userHasPermission($owner, $permission->value),
                "Owner by mal mať permission: {$permission->value}"
            );
        }
    }

    public function test_owner_userPermissions_returns_all_permissions(): void
    {
        $owner = User::factory()->create();
        $project = $this->createProject($owner);

        $this->assertEquals(ProjectPermission::values(), $project->userPermissions($owner));
    }

    // =========================================================================
    // TEAM MEMBER – has permission
    // =========================================================================

    public function test_member_with_view_project_can_view_project(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProject($owner);
        $this->attachMember($project, $member, [ProjectPermission::VIEW_PROJECT->value]);

        $this->actingAs($member)
            ->get("/projects/{$project->id}")
            ->assertOk();
    }

    public function test_member_with_edit_project_can_update_project(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProject($owner);
        $this->attachMember($project, $member, [ProjectPermission::EDIT_PROJECT->value]);

        $this->actingAs($member)
            ->put("/projects/{$project->id}", [
                'name' => 'Nový názov',
                'status' => 'active',
                'workload' => 'medium',
                'start_date' => now()->format('Y-m-d'),
                'end_date' => now()->addMonth()->format('Y-m-d'),
            ])
            ->assertRedirect();
    }

    public function test_member_with_delete_project_can_delete_project(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProject($owner);
        $this->attachMember($project, $member, [ProjectPermission::DELETE_PROJECT->value]);

        $this->actingAs($member)
            ->delete("/projects/{$project->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_member_with_manage_team_can_update_team(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $newMember = User::factory()->create();
        $project = $this->createProject($owner);
        $this->attachMember($project, $member, [ProjectPermission::MANAGE_TEAM->value]);

        $this->actingAs($member)
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

    // =========================================================================
    // TEAM MEMBER – does not have permission → 403
    // =========================================================================

    public function test_member_without_view_project_gets_403(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProject($owner);
        $this->attachMember($project, $member, []);

        $this->actingAs($member)
            ->get("/projects/{$project->id}")
            ->assertForbidden();
    }

    public function test_member_without_edit_project_gets_403_on_update(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProject($owner);
        $this->attachMember($project, $member, [ProjectPermission::VIEW_PROJECT->value]);

        $this->actingAs($member)
            ->put("/projects/{$project->id}", ['name' => 'Hack'])
            ->assertForbidden();
    }

    public function test_member_without_delete_project_gets_403_on_delete(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProject($owner);
        $this->attachMember($project, $member, [ProjectPermission::VIEW_PROJECT->value]);

        $this->actingAs($member)
            ->delete("/projects/{$project->id}")
            ->assertForbidden();
    }

    public function test_member_without_manage_team_gets_403_on_team_update(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProject($owner);
        $this->attachMember($project, $member, [ProjectPermission::VIEW_PROJECT->value]);

        $this->actingAs($member)
            ->put("/projects/{$project->id}/team", [
                'team_members' => [],
                'team_settings' => [],
            ])
            ->assertForbidden();
    }

    // =========================================================================
    // USER OUTSIDE THE TEAM
    // =========================================================================

    public function test_user_outside_team_gets_403_on_view(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $project = $this->createProject($owner);

        $this->actingAs($outsider)
            ->get("/projects/{$project->id}")
            ->assertForbidden();
    }

    public function test_user_outside_team_gets_403_on_update(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $project = $this->createProject($owner);

        $this->actingAs($outsider)
            ->put("/projects/{$project->id}", ['name' => 'Hack'])
            ->assertForbidden();
    }

    public function test_user_outside_team_gets_403_on_delete(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $project = $this->createProject($owner);

        $this->actingAs($outsider)
            ->delete("/projects/{$project->id}")
            ->assertForbidden();
    }

    // =========================================================================
    // UNAUTHENTICATED USER
    // =========================================================================

    public function test_unauthenticated_user_is_redirected_from_project_detail(): void
    {
        $project = $this->createProject();

        $this->get("/projects/{$project->id}")
            ->assertRedirect('/login');
    }

    public function test_unauthenticated_user_is_redirected_from_update(): void
    {
        $project = $this->createProject();

        $this->put("/projects/{$project->id}", ['name' => 'Hack'])
            ->assertRedirect('/login');
    }

    // =========================================================================
    // MODEL METHODS
    // =========================================================================

    public function test_userHasPermission_returns_true_for_assigned_permission(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProject($owner);
        $this->attachMember($project, $member, [
            ProjectPermission::VIEW_PROJECT->value,
            ProjectPermission::EDIT_TASKS->value,
        ]);

        $this->assertTrue($project->userHasPermission($member, ProjectPermission::VIEW_PROJECT->value));
        $this->assertTrue($project->userHasPermission($member, ProjectPermission::EDIT_TASKS->value));
        $this->assertFalse($project->userHasPermission($member, ProjectPermission::DELETE_PROJECT->value));
    }

    public function test_userHasAnyPermission_returns_true_if_at_least_one_matches(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProject($owner);
        $this->attachMember($project, $member, [ProjectPermission::VIEW_PROJECT->value]);

        $this->assertTrue($project->userHasAnyPermission($member, [
            ProjectPermission::VIEW_PROJECT->value,
            ProjectPermission::DELETE_PROJECT->value,
        ]));

        $this->assertFalse($project->userHasAnyPermission($member, [
            ProjectPermission::DELETE_PROJECT->value,
            ProjectPermission::EDIT_PROJECT->value,
        ]));
    }

    public function test_userHasAllPermissions_returns_true_only_if_all_match(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProject($owner);
        $this->attachMember($project, $member, [
            ProjectPermission::VIEW_PROJECT->value,
            ProjectPermission::EDIT_TASKS->value,
        ]);

        $this->assertTrue($project->userHasAllPermissions($member, [
            ProjectPermission::VIEW_PROJECT->value,
            ProjectPermission::EDIT_TASKS->value,
        ]));

        $this->assertFalse($project->userHasAllPermissions($member, [
            ProjectPermission::VIEW_PROJECT->value,
            ProjectPermission::DELETE_PROJECT->value,
        ]));
    }

    public function test_userPermissions_returns_empty_array_for_user_outside_team(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $project = $this->createProject($owner);

        $this->assertEquals([], $project->userPermissions($outsider));
    }

    public function test_userPermissions_returns_correct_array_for_team_member(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProject($owner);
        $assigned = [ProjectPermission::VIEW_PROJECT->value, ProjectPermission::EDIT_TASKS->value];
        $this->attachMember($project, $member, $assigned);

        $this->assertEquals($assigned, $project->userPermissions($member));
    }

    // =========================================================================
    // SYNC TEAM – maintaining existing permissions
    // =========================================================================

    public function test_existing_member_permissions_are_preserved_when_adding_new_member(): void
    {
        $owner = User::factory()->create();
        $existingMember = User::factory()->create();
        $newMember = User::factory()->create();
        $project = $this->createProject($owner);

        $this->attachMember($project, $existingMember, [
            ProjectPermission::VIEW_PROJECT->value,
            ProjectPermission::CREATE_TASKS->value,
        ]);

        $this->actingAs($owner)
            ->put("/projects/{$project->id}/team", [
                'team_members' => [$existingMember->id, $newMember->id],
                'team_settings' => [
                    $newMember->id => [
                        'permissions' => [ProjectPermission::VIEW_PROJECT->value],
                        'allocation' => 100,
                    ],
                ],
            ])
            ->assertRedirect();

        $project->refresh();
        $permissions = $project->userPermissions($existingMember);

        $this->assertContains(ProjectPermission::VIEW_PROJECT->value, $permissions);
        $this->assertContains(ProjectPermission::CREATE_TASKS->value, $permissions);
    }

    public function test_new_member_gets_default_permissions_when_no_settings_provided(): void
    {
        $owner = User::factory()->create();
        $newMember = User::factory()->create();
        $project = $this->createProject($owner);

        $this->actingAs($owner)
            ->put("/projects/{$project->id}/team", [
                'team_members' => [$newMember->id],
                'team_settings' => [],
            ])
            ->assertRedirect();

        $project->refresh();
        $permissions = $project->userPermissions($newMember);

        $this->assertContains(ProjectPermission::VIEW_PROJECT->value, $permissions);
    }

    public function test_member_permissions_are_updated_when_settings_are_provided(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProject($owner);

        $this->attachMember($project, $member, [ProjectPermission::VIEW_PROJECT->value]);

        $this->actingAs($owner)
            ->put("/projects/{$project->id}/team", [
                'team_members' => [$member->id],
                'team_settings' => [
                    $member->id => [
                        'permissions' => [
                            ProjectPermission::VIEW_PROJECT->value,
                            ProjectPermission::CREATE_TASKS->value,
                            ProjectPermission::EDIT_TASKS->value,
                        ],
                        'allocation' => 80,
                    ],
                ],
            ])
            ->assertRedirect();

        $project->refresh();
        $permissions = $project->userPermissions($member);

        $this->assertContains(ProjectPermission::CREATE_TASKS->value, $permissions);
        $this->assertContains(ProjectPermission::EDIT_TASKS->value, $permissions);
    }
}
