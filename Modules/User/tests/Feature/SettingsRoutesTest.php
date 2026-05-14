<?php

namespace Modules\User\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\User\Models\User;
use Tests\TestCase;

class SettingsRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_from_settings_pages(): void
    {
        $this->get(route('profile.edit'))->assertRedirect(route('login'));
        $this->get(route('password.edit'))->assertRedirect(route('login'));
        $this->get(route('appearance.edit'))->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_open_module_settings_pages(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('profile.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('User/settings/profile')
                ->has('mustVerifyEmail')
                ->has('status')
            );

        $this->actingAs($user)
            ->get(route('password.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('User/settings/password')
            );

        $this->actingAs($user)
            ->get(route('appearance.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('User/settings/appearance')
            );
    }

    public function test_user_can_update_their_profile_from_user_module_settings(): void
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'old@example.com',
        ]);

        $this->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'New Name',
                'email' => 'new@example.com',
            ])
            ->assertRedirect(route('profile.edit'));

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name',
            'email' => 'new@example.com',
            'email_verified_at' => null,
        ]);
    }

    public function test_user_can_update_their_password_from_user_module_settings(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old-password'),
        ]);

        $this->actingAs($user)
            ->put(route('password.update'), [
                'current_password' => 'old-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ])
            ->assertRedirect();

        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
    }
}
