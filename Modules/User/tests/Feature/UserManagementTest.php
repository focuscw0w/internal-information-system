<?php

namespace Modules\User\Tests\Feature;

use Carbon\Carbon;
use Modules\CapacityManagement\Enums\CapacityPermission;
use Modules\Project\Enums\ProjectGlobalPermission;
use Modules\User\Contracts\PermissionRegistryInterface;
use Modules\User\Enums\UserPermission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Modules\User\Models\User;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    protected function setUp(): void
    {
        parent::setUp();

        foreach (app(PermissionRegistryInterface::class)->all() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
    }

    private function createAdmin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function createRegularUser(): User
    {
        return User::factory()->create();
    }

    // =========================================================================
    // ADMIN – ACCESS
    // =========================================================================

    public function test_admin_can_open_user_management_screen(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->get(route('user.index'))
            ->assertOk();
    }

    public function test_manage_page_returns_users_with_their_permissions(): void
    {
        $admin = $this->createAdmin();

        $user = $this->createRegularUser();
        $user->givePermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value);

        $response = $this->actingAs($admin)->get(route('user.index'));

        $response->assertOk();
        $props = $response->original->getData()['page']['props'];

        $managedUser = collect($props['users'])->firstWhere('id', $user->id);

        $this->assertContains(ProjectGlobalPermission::PROJECTS_CREATE->value, $managedUser['permissions']);
    }

    public function test_manage_page_returns_users_with_last_activity_from_sessions(): void
    {
        $admin = $this->createAdmin();
        $activeUser = $this->createRegularUser();
        $inactiveUser = $this->createRegularUser();
        $lastActivity = now()->subMinutes(12)->timestamp;

        DB::table('sessions')->insert([
            [
                'id' => 'older-session',
                'user_id' => $activeUser->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PHPUnit',
                'payload' => 'test',
                'last_activity' => now()->subHour()->timestamp,
            ],
            [
                'id' => 'latest-session',
                'user_id' => $activeUser->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PHPUnit',
                'payload' => 'test',
                'last_activity' => $lastActivity,
            ],
        ]);

        $response = $this->actingAs($admin)->get(route('user.index'));

        $response->assertOk();
        $props = $response->original->getData()['page']['props'];

        $activeManagedUser = collect($props['users'])->firstWhere('id', $activeUser->id);
        $inactiveManagedUser = collect($props['users'])->firstWhere('id', $inactiveUser->id);

        $this->assertSame(
            Carbon::createFromTimestamp($lastActivity)->toIso8601String(),
            $activeManagedUser['last_active_at'],
        );
        $this->assertNull($inactiveManagedUser['last_active_at']);
    }

    // =========================================================================
    // ADMIN – CREATE USER
    // =========================================================================

    public function test_admin_can_create_user(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post(route('user.store'), [
            'name' => 'Novy Pouzivatel',
            'email' => 'novy@example.com',
            'password' => 'strong-password-123',
        ]);

        $response->assertRedirect(route('user.index'));
        $response->assertSessionHas('status', 'Používateľ bol úspešne vytvorený.');

        $this->assertDatabaseHas('users', [
            'name' => 'Novy Pouzivatel',
            'email' => 'novy@example.com',
        ]);
    }

    public function test_created_user_has_assigned_permissions(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)->post(route('user.store'), [
            'name' => 'S Permissions',
            'email' => 'perms@example.com',
            'password' => 'strong-password-123',
            'permissions' => [
                ProjectGlobalPermission::PROJECTS_CREATE->value,
                UserPermission::USERS_VIEW->value,
            ],
        ]);

        $user = User::where('email', 'perms@example.com')->first();

        $this->assertTrue($user->hasPermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value));
        $this->assertTrue($user->hasPermissionTo(UserPermission::USERS_VIEW->value));
        $this->assertFalse($user->is_admin);
    }

    // =========================================================================
    // ADMIN – UPDATE USER
    // =========================================================================

    public function test_admin_can_update_user_name_and_email(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();

        $this->actingAs($admin)->put("/users/{$user->id}", [
            'name' => 'Upravené meno',
            'email' => 'novy-email@example.com',
            'permissions' => [],
        ])->assertRedirect();

        $user->refresh();
        $this->assertEquals('Upravené meno', $user->name);
        $this->assertEquals('novy-email@example.com', $user->email);
    }

    public function test_admin_can_update_user_permissions(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();

        $this->actingAs($admin)->put("/users/{$user->id}", [
            'name' => $user->name,
            'email' => $user->email,
            'permissions' => [ProjectGlobalPermission::PROJECTS_CREATE->value],
        ])->assertRedirect();

        $user->refresh();
        $this->assertTrue($user->hasPermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value));
    }

    public function test_admin_can_remove_user_permissions(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();
        $user->givePermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value);

        $this->actingAs($admin)->put("/users/{$user->id}", [
            'name' => $user->name,
            'email' => $user->email,
            'permissions' => [],
        ])->assertRedirect();

        $user->refresh();
        $this->assertFalse($user->hasPermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value));
    }

    public function test_update_with_null_permissions_removes_existing_permissions(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();
        $user->givePermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value);
        $this->assertTrue($user->hasPermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value));

        $this->actingAs($admin)->put("/users/{$user->id}", [
            'name' => $user->name,
            'email' => $user->email,
            'permissions' => null,
        ])->assertRedirect();

        $user->refresh();
        $this->assertFalse($user->hasPermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value));
    }

    // =========================================================================
    // ADMIN – CHANGE PASSWORD
    // =========================================================================

    public function test_admin_can_change_user_password(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();
        $oldPassword = $user->password;

        $this->actingAs($admin)->put("/users/{$user->id}", [
            'name' => $user->name,
            'email' => $user->email,
            'password' => 'noveheslo123',
            'permissions' => [],
        ])->assertRedirect();

        $user->refresh();
        $this->assertNotEquals($oldPassword, $user->password);
        $this->assertTrue(Hash::check('noveheslo123', $user->password));
    }

    public function test_empty_password_does_not_change_existing_password(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();
        $oldPassword = $user->password;

        $this->actingAs($admin)->put("/users/{$user->id}", [
            'name' => 'Nové meno',
            'email' => $user->email,
            'password' => '',
            'permissions' => [],
        ])->assertRedirect();

        $user->refresh();
        $this->assertEquals('Nové meno', $user->name);
        $this->assertEquals($oldPassword, $user->password);
    }

    // =========================================================================
    // ADMIN – DELETE USER
    // =========================================================================

    public function test_admin_can_delete_user(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();

        $this->actingAs($admin)
            ->delete("/users/{$user->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    // =========================================================================
    // ADMIN – VIEW USER PROFILE
    // =========================================================================

    public function test_admin_can_view_user_profile_via_admin_route(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();

        $this->actingAs($admin)
            ->get("/users/{$user->id}")
            ->assertOk();
    }

    public function test_admin_sees_correct_user_data_on_profile_page(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();
        $user->givePermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value);

        $response = $this->actingAs($admin)->get("/users/{$user->id}");

        $response->assertOk();
        $props = $response->original->getData()['page']['props'];

        $this->assertEquals($user->name, $props['user']['name']);
        $this->assertEquals($user->email, $props['user']['email']);
        $this->assertFalse($props['isOwnProfile']);
        $this->assertCount(1, $props['permissions']);
        $this->assertSame(ProjectGlobalPermission::PROJECTS_CREATE->description(), $props['permissions'][0]['description']);
    }

    // =========================================================================
    // ADMIN – VALIDATION
    // =========================================================================

    public function test_invalid_permission_is_rejected_on_create(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->post(route('user.store'), [
                'name' => 'Hacker',
                'email' => 'hack@test.com',
                'password' => 'heslo123',
                'permissions' => ['neexistujuca.permission'],
            ])
            ->assertSessionHasErrors('permissions.0');
    }

    public function test_duplicate_email_is_rejected_on_create(): void
    {
        $admin = $this->createAdmin();
        $existing = $this->createRegularUser();

        $this->actingAs($admin)
            ->post(route('user.store'), [
                'name' => 'Duplicita',
                'email' => $existing->email,
                'password' => 'heslo123',
            ])
            ->assertSessionHasErrors('email');
    }

    public function test_duplicate_email_is_rejected_on_update(): void
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

    public function test_short_password_is_rejected_on_update(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createRegularUser();

        $this->actingAs($admin)
            ->put("/users/{$user->id}", [
                'name' => $user->name,
                'email' => $user->email,
                'password' => 'abc',
                'permissions' => [],
            ])
            ->assertSessionHasErrors('password');
    }

    // =========================================================================
    // REGULAR USER – DENIED ACCESS
    // =========================================================================

    public function test_regular_user_cannot_access_user_management(): void
    {
        $user = $this->createRegularUser();

        $this->actingAs($user)
            ->get(route('user.index'))
            ->assertForbidden();
    }

    public function test_regular_user_cannot_create_user(): void
    {
        $user = $this->createRegularUser();

        $this->actingAs($user)
            ->post(route('user.store'), [
                'name' => 'Hack',
                'email' => 'hack@test.com',
                'password' => 'heslo123',
            ])
            ->assertForbidden();
    }

    public function test_regular_user_cannot_update_user(): void
    {
        $user = $this->createRegularUser();
        $target = $this->createRegularUser();

        $this->actingAs($user)
            ->put("/users/{$target->id}", [
                'name' => 'Hack',
                'email' => $target->email,
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

    public function test_any_authenticated_user_can_access_own_profile(): void
    {
        $user = $this->createRegularUser();

        $this->actingAs($user)
            ->get('/profile')
            ->assertOk();
    }

    public function test_own_profile_returns_is_own_profile_true(): void
    {
        $user = $this->createRegularUser();

        $response = $this->actingAs($user)->get('/profile');

        $props = $response->original->getData()['page']['props'];
        $this->assertTrue($props['isOwnProfile']);
    }

    // =========================================================================
    // UNAUTHENTICATED – REDIRECTS
    // =========================================================================

    public function test_unauthenticated_user_is_redirected_from_user_management(): void
    {
        $this->get(route('user.index'))
            ->assertRedirect('/login');
    }

    public function test_unauthenticated_user_is_redirected_from_profile(): void
    {
        $this->get('/profile')
            ->assertRedirect('/login');
    }
}
