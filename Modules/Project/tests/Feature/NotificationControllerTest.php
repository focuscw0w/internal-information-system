<?php

namespace Modules\Project\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Project\Notifications\TaskAssignedNotification;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class NotificationControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function guests_are_redirected_from_notifications(): void
    {
        $this->get('/notifications')->assertRedirect('/login');
    }

    #[Test]
    public function user_can_list_only_their_notifications(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $notification = $this->createDatabaseNotification($user);
        $this->createDatabaseNotification($otherUser);

        $this->actingAs($user)
            ->getJson('/notifications')
            ->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $notification->id)
            ->assertJsonPath('data.0.data.type', 'task_assigned');
    }

    #[Test]
    public function user_can_mark_their_notification_as_read(): void
    {
        $user = User::factory()->create();
        $notification = $this->createDatabaseNotification($user);

        $this->actingAs($user)
            ->patchJson("/notifications/{$notification->id}/read")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    #[Test]
    public function user_cannot_mark_another_users_notification_as_read(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $notification = $this->createDatabaseNotification($otherUser);

        $this->actingAs($user)
            ->patchJson("/notifications/{$notification->id}/read")
            ->assertNotFound()
            ->assertJsonPath('success', false);

        $this->assertNull($notification->fresh()->read_at);
    }

    #[Test]
    public function user_can_mark_all_their_notifications_as_read(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->createDatabaseNotification($user);
        $this->createDatabaseNotification($user);
        $this->createDatabaseNotification($otherUser);

        $this->actingAs($user)
            ->postJson('/notifications/mark-all-read')
            ->assertOk()
            ->assertJsonPath('marked', 2);

        $this->assertSame(0, $user->unreadNotifications()->count());
        $this->assertSame(1, $otherUser->unreadNotifications()->count());
    }

    private function createDatabaseNotification(User $user): mixed
    {
        return $user->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => TaskAssignedNotification::class,
            'data' => [
                'type' => 'task_assigned',
                'title' => 'Priradenie úlohy',
                'message' => 'Test notifikácia',
                'project_id' => 1,
                'project_name' => 'Test projekt',
                'task_id' => 1,
                'task_title' => 'Test úloha',
                'url' => '/projects/1/tasks/1',
                'priority' => 'medium',
            ],
            'read_at' => null,
        ]);
    }
}
