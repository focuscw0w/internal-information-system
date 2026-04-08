<?php

namespace Modules\Project\Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Contracts\CommentServiceInterface;
use Modules\Project\Models\Comment;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\Project\Services\CommentService;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CommentServiceTest extends TestCase
{
    use RefreshDatabase;

    private CommentService $service;
    private Task $task;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $owner = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $this->task = Task::factory()->create(['project_id' => $project->id]);
        $this->user = User::factory()->create();
        $this->service = app(CommentServiceInterface::class);
    }

    #[Test]
    public function it_creates_comment_associated_with_the_task(): void
    {
        $this->service->store($this->task, $this->user->id, ['body' => 'Test komentár']);

        $this->assertDatabaseHas('comments', [
            'task_id' => $this->task->id,
            'body' => 'Test komentár',
        ]);
    }

    #[Test]
    public function it_sets_the_correct_user_id(): void
    {
        $this->service->store($this->task, $this->user->id, ['body' => 'Komentár používateľa']);

        $this->assertDatabaseHas('comments', [
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
        ]);
    }

    #[Test]
    public function it_persists_the_body_text(): void
    {
        $body = 'Toto je obsah komentára.';

        $this->service->store($this->task, $this->user->id, ['body' => $body]);

        $this->assertDatabaseHas('comments', ['body' => $body]);
    }

    #[Test]
    public function it_returns_a_comment_model_instance(): void
    {
        $comment = $this->service->store($this->task, $this->user->id, ['body' => 'Vrátený model']);

        $this->assertInstanceOf(Comment::class, $comment);
        $this->assertEquals('Vrátený model', $comment->body);
    }
}
