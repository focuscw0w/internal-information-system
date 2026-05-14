<?php

namespace Modules\User\Tests\Feature;

use Modules\CapacityManagement\Enums\CapacityPermission;
use Modules\Project\Enums\ProjectGlobalPermission;
use Modules\User\Contracts\PermissionRegistryInterface;
use Modules\User\Enums\UserPermission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\User\Models\User;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;
use Illuminate\Support\Facades\Hash;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function createAdmin(): User
    {
        foreach (app(PermissionRegistryInterface::class)->all() as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        return User::factory()->create(['is_admin' => true]);
    }

    private function createRegularUser(): User
    {
        return User::factory()->create();
    }

    // =========================================================================
    // ADMIN – CAN ACCESS USER MANAGEMENT
    // =========================================================================

    public function test_admin_can_access_user_management_page(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->get('/users')
            ->assertOk();
    }

    public function test_admin_can_create_user(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->post('/users', [
                'name' => 'Nový Používateľ',
                'email' => 'novy@test.com',
                'password' => 'heslo123',
                'permissions' => [],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'novy@test.com',
            'name' => 'Nový Používateľ',
        ]);
    }

    public function test_admin_can_create_user_with_permissions(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->post('/users', [
                'name' => 'User s permissions',
                'email' => 'perms@test.com',
                'password' => 'heslo123',
                'permissions' => [
                    ProjectGlobalPermission::PROJECTS_CREATE->value,
                    UserPermission::USERS_VIEW->value,
                ],
            ])
            ->assertRedirect();

        $user = User::where('email', 'perms@test.com')->first();

        $this->assertTrue($user->hasPermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value));
        $this->assertTrue($user->hasPermissionTo(UserPermission::USERS_VIEW->value));
        $this->assertFalse($user->is_admin);
    }

    public function test_admin_can_update_user(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();

        $this->actingAs($admin)
            ->put("/users/{$user->id}", [
                'name' => 'Upravené meno',
                'email' => $user->email,
                'permissions' => [],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Upravené meno',
        ]);
    }

    public function test_admin_can_update_user_permissions(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();

        $this->actingAs($admin)
            ->put("/users/{$user->id}", [
                'name' => $user->name,
                'email' => $user->email,
                'permissions' => [ProjectGlobalPermission::PROJECTS_CREATE->value],
            ])
            ->assertRedirect();

        $user->refresh();
        $this->assertTrue($user->hasPermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value));
    }

    public function test_admin_can_remove_user_permissions(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();
        $user->givePermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value);

        $this->actingAs($admin)
            ->put("/users/{$user->id}", [
                'name' => $user->name,
                'email' => $user->email,
                'permissions' => [],
            ])
            ->assertRedirect();

        $user->refresh();
        $this->assertFalse($user->hasPermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value));
    }

    public function test_admin_can_delete_user(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();

        $this->actingAs($admin)
            ->delete("/users/{$user->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_admin_can_view_user_profile(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();

        $this->actingAs($admin)
            ->get("/users/{$user->id}")
            ->assertOk();
    }

    public function test_admin_can_change_user_password(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();
        $oldPassword = $user->password;

        $this->actingAs($admin)
            ->put("/users/{$user->id}", [
                'name' => $user->name,
                'email' => $user->email,
                'password' => 'noveheslo123',
                'permissions' => [],
            ])
            ->assertRedirect();

        $user->refresh();
        $this->assertNotEquals($oldPassword, $user->password);
        $this->assertTrue(Hash::check('noveheslo123', $user->password));
    }

    public function test_admin_can_update_user_without_changing_password(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();
        $oldPassword = $user->password;

        $this->actingAs($admin)
            ->put("/users/{$user->id}", [
                'name' => 'Nové meno',
                'email' => $user->email,
                'password' => '',
                'permissions' => [],
            ])
            ->assertRedirect();

        $user->refresh();
        $this->assertEquals('Nové meno', $user->name);
        $this->assertEquals($oldPassword, $user->password);
    }

    // =========================================================================
    // ADMIN – VALIDATION
    // =========================================================================

    public function test_admin_cannot_create_user_with_invalid_permission(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->post('/users', [
                'name' => 'Hacker',
                'email' => 'hack@test.com',
                'password' => 'heslo123',
                'permissions' => ['neexistujuca.permission'],
            ])
            ->assertSessionHasErrors('permissions.0');
    }

    public function test_admin_cannot_create_user_with_duplicate_email(): void
    {
        $admin = $this->createAdmin();
        $existing = $this->createRegularUser();

        $this->actingAs($admin)
            ->post('/users', [
                'name' => 'Duplicita',
                'email' => $existing->email,
                'password' => 'heslo123',
                'permissions' => [],
            ])
            ->assertSessionHasErrors('email');
    }

    public function test_admin_cannot_update_user_email_to_existing_one(): void
    {
        $admin = $this->createAdmin();
        $user1 = $this->createRegularUser();
        $user2 = $this->createRegularUser();

        $this->actingAs($admin)
            ->put("/users/{$user1->id}", [
                'name' => $user1->name,
                'email' => $user2->email,
                'permissions' => [],
            ])
            ->assertSessionHasErrors('email');
    }

    // =========================================================================
    // REGULAR USER – CANNOT ACCESS USER MANAGEMENT
    // =========================================================================

    public function test_regular_user_cannot_access_user_management(): void
    {
        $user = $this->createRegularUser();

        $this->actingAs($user)
            ->get('/users')
            ->assertForbidden();
    }

    public function test_regular_user_cannot_create_user(): void
    {
        $user = $this->createRegularUser();

        $this->actingAs($user)
            ->post('/users', [
                'name' => 'Hack',
                'email' => 'hack@test.com',
                'password' => 'heslo123',
                'permissions' => [],
            ])
            ->assertForbidden();
    }

    public function test_regular_user_cannot_delete_user(): void
    {
        $user = $this->createRegularUser();
        $target = $this->createRegularUser();

        $this->actingAs($user)
            ->delete("/users/{$target->id}")
            ->assertForbidden();
    }

    public function test_regular_user_cannot_view_other_user_profile_via_admin_route(): void
    {
        $user = $this->createRegularUser();
        $other = $this->createRegularUser();

        $this->actingAs($user)
            ->get("/users/{$other->id}")
            ->assertForbidden();
    }

    // =========================================================================
    // PROFILE – OWN ACCESS
    // =========================================================================

    public function test_any_user_can_access_own_profile(): void
    {
        $user = $this->createRegularUser();

        $this->actingAs($user)
            ->get('/profile')
            ->assertOk();
    }

    public function test_unauthenticated_user_is_redirected_from_profile(): void
    {
        $this->get('/profile')
            ->assertRedirect('/login');
    }

    public function test_unauthenticated_user_is_redirected_from_user_management(): void
    {
        $this->get('/users')
            ->assertRedirect('/login');
    }
}
