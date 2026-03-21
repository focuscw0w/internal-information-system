<?php

use App\Enums\PermissionEnum;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate(PermissionEnum::USERS_MANAGE->value, 'web');
});

test('admin with users.manage permission can open user management screen', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo(PermissionEnum::USERS_MANAGE->value);

    $this->actingAs($admin)
        ->get(route('user.index'))
        ->assertOk();
});

test('non admin can not open user management screen', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('user.index'))
        ->assertForbidden();
});

test('admin can create user from user module', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo(PermissionEnum::USERS_MANAGE->value);

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
});
