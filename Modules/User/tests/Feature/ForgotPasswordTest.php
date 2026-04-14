<?php

namespace Modules\User\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Modules\Project\Notifications\PasswordResetRequestedNotification;
use Modules\User\Models\User;
use Tests\TestCase;

class ForgotPasswordTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function createRegularUser(): User
    {
        return User::factory()->create(['is_admin' => false]);
    }

    // =========================================================================
    // PAGE ACCESS
    // =========================================================================

    public function test_guest_can_access_forgot_password_page(): void
    {
        $this->get('/forgot-password')
            ->assertOk();
    }

    public function test_authenticated_user_is_redirected_from_forgot_password_page(): void
    {
        $user = $this->createRegularUser();

        $this->actingAs($user)
            ->get('/forgot-password')
            ->assertRedirect();
    }

    // =========================================================================
    // SUCCESSFUL SUBMISSION
    // =========================================================================

    public function test_submitting_existing_email_notifies_all_admins(): void
    {
        Notification::fake();

        $admin = $this->createAdmin();
        $user = $this->createRegularUser();

        $this->post('/forgot-password', ['email' => $user->email])
            ->assertRedirect()
            ->assertSessionHas('status', 'Vaša žiadosť bola odoslaná správcovi systému.');

        Notification::assertSentTo($admin, PasswordResetRequestedNotification::class);
    }

    public function test_submitting_existing_email_notifies_multiple_admins(): void
    {
        Notification::fake();

        $admin1 = $this->createAdmin();
        $admin2 = $this->createAdmin();
        $user = $this->createRegularUser();

        $this->post('/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo($admin1, PasswordResetRequestedNotification::class);
        Notification::assertSentTo($admin2, PasswordResetRequestedNotification::class);
    }

    public function test_notification_contains_correct_url_for_admin_redirect(): void
    {
        Notification::fake();

        $admin = $this->createAdmin();
        $user = $this->createRegularUser();

        $this->post('/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo(
            $admin,
            PasswordResetRequestedNotification::class,
            function (PasswordResetRequestedNotification $notification) use ($user) {
                $data = $notification->toArray();
                return $data['url'] === "/users?edit={$user->id}";
            }
        );
    }

    // =========================================================================
    // SECURITY – NO INFORMATION LEAK
    // =========================================================================

    public function test_submitting_nonexistent_email_returns_same_success_message(): void
    {
        Notification::fake();

        $this->post('/forgot-password', ['email' => 'neexistuje@example.com'])
            ->assertRedirect()
            ->assertSessionHas('status', 'Vaša žiadosť bola odoslaná správcovi systému.');
    }

    public function test_submitting_nonexistent_email_does_not_send_any_notification(): void
    {
        Notification::fake();

        $this->createAdmin();

        $this->post('/forgot-password', ['email' => 'neexistuje@example.com']);

        Notification::assertNothingSent();
    }

    public function test_regular_users_do_not_receive_password_reset_notification(): void
    {
        Notification::fake();

        $admin = $this->createAdmin();
        $otherUser = $this->createRegularUser();
        $requestingUser = $this->createRegularUser();

        $this->post('/forgot-password', ['email' => $requestingUser->email]);

        Notification::assertNotSentTo($otherUser, PasswordResetRequestedNotification::class);
        Notification::assertSentTo($admin, PasswordResetRequestedNotification::class);
    }

    // =========================================================================
    // VALIDATION
    // =========================================================================

    public function test_empty_email_fails_validation(): void
    {
        $this->post('/forgot-password', ['email' => ''])
            ->assertSessionHasErrors('email');
    }

    public function test_invalid_email_format_fails_validation(): void
    {
        $this->post('/forgot-password', ['email' => 'not-an-email'])
            ->assertSessionHasErrors('email');
    }
}
