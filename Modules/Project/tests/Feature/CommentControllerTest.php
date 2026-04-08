<?php

namespace Modules\Project\Tests\Feature;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\Project\Tests\Concerns\HasProjectHelpers;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CommentControllerTest extends TestCase
{
    use RefreshDatabase, HasProjectHelpers;

    private User $owner;
    private Project $project;
    private Task $task;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(PermissionSeeder::class);

        $this->owner = User::factory()->create();
        $this->project = $this->createProject($this->owner);
        $this->task = Task::factory()->create(['project_id' => $this->project->id]);
    }

    private function commentsUrl(): string
    {
        return "/projects/{$this->project->id}/tasks/{$this->task->id}/comments";
    }

    // =========================================================================
    // store
    // =========================================================================

    #[Test]
    public function owner_can_post_a_comment(): void
    {
        $this->actingAs($this->owner)
            ->post($this->commentsUrl(), ['body' => 'Komentár od vlastníka'])
            ->assertRedirect();

        $this->assertDatabaseHas('comments', [
            'task_id' => $this->task->id,
            'user_id' => $this->owner->id,
            'body' => 'Komentár od vlastníka',
        ]);
    }

    #[Test]
    public function member_with_view_tasks_can_post_a_comment(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['view_tasks']);

        $this->actingAs($member)
            ->post($this->commentsUrl(), ['body' => 'Komentár od člena'])
            ->assertRedirect();

        $this->assertDatabaseHas('comments', [
            'task_id' => $this->task->id,
            'user_id' => $member->id,
        ]);
    }

    #[Test]
    public function outsider_cannot_post_a_comment(): void
    {
        $outsider = User::factory()->create();

        $this->actingAs($outsider)
            ->post($this->commentsUrl(), ['body' => 'Odmietnutý komentár'])
            ->assertForbidden();
    }

    #[Test]
    public function store_fails_when_body_is_missing(): void
    {
        $this->actingAs($this->owner)
            ->post($this->commentsUrl(), ['body' => ''])
            ->assertSessionHasErrors('body');
    }

    #[Test]
    public function store_fails_when_body_exceeds_5000_characters(): void
    {
        $this->actingAs($this->owner)
            ->post($this->commentsUrl(), ['body' => str_repeat('a', 5001)])
            ->assertSessionHasErrors('body');
    }

    #[Test]
    public function comment_is_associated_with_the_acting_user(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['view_tasks']);

        $this->actingAs($member)
            ->post($this->commentsUrl(), ['body' => 'Test']);

        $this->assertDatabaseHas('comments', [
            'task_id' => $this->task->id,
            'user_id' => $member->id,
        ]);
    }

    #[Test]
    public function unauthenticated_user_is_redirected_to_login(): void
    {
        $this->post($this->commentsUrl(), ['body' => 'Bez prihlásenia'])
            ->assertRedirect(route('login'));
    }
}
