<?php

namespace Modules\User\Tests\Feature;

use App\Enums\PermissionEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\User\Models\User;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function createAdmin(): User
    {
        foreach (PermissionEnum::all() as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $admin = User::factory()->create();
        $admin->syncPermissions(PermissionEnum::all());

        return $admin;
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
                    PermissionEnum::PROJECTS_CREATE->value,
                    PermissionEnum::USERS_VIEW->value,
                ],
            ])
            ->assertRedirect();

        $user = User::where('email', 'perms@test.com')->first();

        $this->assertTrue($user->hasPermissionTo(PermissionEnum::PROJECTS_CREATE->value));
        $this->assertTrue($user->hasPermissionTo(PermissionEnum::USERS_VIEW->value));
        $this->assertFalse($user->hasPermissionTo(PermissionEnum::USERS_MANAGE->value));
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
                'permissions' => [PermissionEnum::PROJECTS_CREATE->value],
            ])
            ->assertRedirect();

        $user->refresh();
        $this->assertTrue($user->hasPermissionTo(PermissionEnum::PROJECTS_CREATE->value));
    }

    public function test_admin_can_remove_user_permissions(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();
        $user->givePermissionTo(PermissionEnum::PROJECTS_CREATE->value);

        $this->actingAs($admin)
            ->put("/users/{$user->id}", [
                'name' => $user->name,
                'email' => $user->email,
                'permissions' => [],
            ])
            ->assertRedirect();

        $user->refresh();
        $this->assertFalse($user->hasPermissionTo(PermissionEnum::PROJECTS_CREATE->value));
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