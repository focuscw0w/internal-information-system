<?php

namespace Modules\User\Tests\Unit;

use Modules\CapacityManagement\Enums\CapacityPermission;
use Modules\Project\Enums\ProjectGlobalPermission;
use Modules\User\Contracts\PermissionRegistryInterface;
use Modules\User\Enums\UserPermission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Modules\User\Contracts\UserServiceInterface;
use Modules\User\Models\User;
use Modules\User\Services\UserService;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class UserServiceTest extends TestCase
{
    use RefreshDatabase;

    private UserService $service;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (app(PermissionRegistryInterface::class)->all() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $this->service = app(UserServiceInterface::class);
    }

    // =========================================================================
    // getAllUsers
    // =========================================================================

    #[Test]
    public function it_returns_all_users_ordered_by_name(): void
    {
        User::factory()->create(['name' => 'Zdenko']);
        User::factory()->create(['name' => 'Anna']);
        User::factory()->create(['name' => 'Martin']);

        $users = $this->service->getAllUsers();

        $this->assertEquals(['Anna', 'Martin', 'Zdenko'], $users->pluck('name')->all());
    }

    #[Test]
    public function it_returns_only_id_name_and_email(): void
    {
        User::factory()->create(['name' => 'Test User']);

        $users = $this->service->getAllUsers();

        $keys = array_keys($users->first()->toArray());
        $this->assertEqualsCanonicalizing(['id', 'name', 'email'], $keys);
    }

    // =========================================================================
    // createUser
    // =========================================================================

    #[Test]
    public function it_creates_a_user_in_the_database(): void
    {
        $this->service->createUser([
            'name' => 'Nový používateľ',
            'email' => 'novy@example.com',
            'password' => bcrypt('secret'),
        ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Nový používateľ',
            'email' => 'novy@example.com',
        ]);
    }

    #[Test]
    public function it_syncs_permissions_when_provided_on_create(): void
    {
        $this->service->createUser([
            'name' => 'Oprávnený',
            'email' => 'opravneny@example.com',
            'password' => bcrypt('secret'),
            'permissions' => [ProjectGlobalPermission::PROJECTS_CREATE->value],
        ]);

        $user = User::where('email', 'opravneny@example.com')->first();

        $this->assertTrue($user->hasPermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value));
    }

    #[Test]
    public function it_does_not_throw_when_no_permissions_provided(): void
    {
        $this->service->createUser([
            'name' => 'Bez oprávnení',
            'email' => 'bez@example.com',
            'password' => bcrypt('secret'),
        ]);

        $user = User::where('email', 'bez@example.com')->first();
        $this->assertNotNull($user);
        $this->assertCount(0, $user->permissions);
    }

    // =========================================================================
    // updateUser
    // =========================================================================

    #[Test]
    public function it_updates_user_name_and_email(): void
    {
        $user = User::factory()->create(['name' => 'Starý', 'email' => 'stary@example.com']);

        $this->service->updateUser($user, [
            'name' => 'Nový',
            'email' => 'novy@example.com',
            'permissions' => [],
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Nový',
            'email' => 'novy@example.com',
        ]);
    }

    #[Test]
    public function it_updates_password_when_provided(): void
    {
        $user = User::factory()->create(['password' => bcrypt('old-password')]);
        $originalHash = $user->password;

        $this->service->updateUser($user, [
            'name' => $user->name,
            'email' => $user->email,
            'password' => bcrypt('new-password'),
            'permissions' => [],
        ]);

        $this->assertNotEquals($originalHash, $user->fresh()->password);
    }

    #[Test]
    public function it_does_not_update_password_when_empty_string(): void
    {
        $user = User::factory()->create(['password' => bcrypt('original')]);
        $originalHash = $user->password;

        $this->service->updateUser($user, [
            'name' => $user->name,
            'email' => $user->email,
            'password' => '',
            'permissions' => [],
        ]);

        $this->assertEquals($originalHash, $user->fresh()->password);
    }

    #[Test]
    public function it_adds_new_permissions_on_update(): void
    {
        $user = User::factory()->create();

        $this->service->updateUser($user, [
            'name' => $user->name,
            'email' => $user->email,
            'permissions' => [ProjectGlobalPermission::PROJECTS_CREATE->value],
        ]);

        $this->assertTrue($user->fresh()->hasPermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value));
    }

    #[Test]
    public function it_removes_old_permissions_on_update(): void
    {
        $user = User::factory()->create();
        $user->givePermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value);

        $this->service->updateUser($user, [
            'name' => $user->name,
            'email' => $user->email,
            'permissions' => [],
        ]);

        $this->assertFalse($user->fresh()->hasPermissionTo(ProjectGlobalPermission::PROJECTS_CREATE->value));
    }

    // =========================================================================
    // deleteUser
    // =========================================================================

    #[Test]
    public function it_deletes_the_user_from_the_database(): void
    {
        $user = User::factory()->create();

        $this->service->deleteUser($user);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }
}
