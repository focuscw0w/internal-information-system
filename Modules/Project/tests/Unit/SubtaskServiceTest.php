<?php

namespace Modules\Project\Tests\Unit;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Contracts\SubtaskServiceInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\Subtask;
use Modules\Project\Models\Task;
use Modules\Project\Services\SubtaskService;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SubtaskServiceTest extends TestCase
{
    use RefreshDatabase;

    private SubtaskService $service;
    private Task $task;

    protected function setUp(): void
    {
        parent::setUp();

        $owner = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $this->task = Task::factory()->create(['project_id' => $project->id]);
        $this->service = app(SubtaskServiceInterface::class);
    }

    // =========================================================================
    // createSubtask
    // =========================================================================

    #[Test]
    public function it_creates_subtask_with_correct_task_id_and_title(): void
    {
        $subtask = $this->service->createSubtask($this->task->id, ['title' => 'Nová podúloha']);

        $this->assertDatabaseHas('subtasks', [
            'task_id' => $this->task->id,
            'title' => 'Nová podúloha',
        ]);
        $this->assertInstanceOf(Subtask::class, $subtask);
    }

    #[Test]
    public function it_assigns_sort_order_starting_at_1_for_first_subtask(): void
    {
        $subtask = $this->service->createSubtask($this->task->id, ['title' => 'Prvá']);

        $this->assertEquals(1, $subtask->sort_order);
    }

    #[Test]
    public function it_auto_increments_sort_order(): void
    {
        $this->service->createSubtask($this->task->id, ['title' => 'Prvá']);
        $second = $this->service->createSubtask($this->task->id, ['title' => 'Druhá']);

        $this->assertEquals(2, $second->sort_order);
    }

    #[Test]
    public function it_throws_model_not_found_for_nonexistent_task(): void
    {
        $this->expectException(ModelNotFoundException::class);

        $this->service->createSubtask(99999, ['title' => 'Neexistujúca úloha']);
    }

    // =========================================================================
    // updateSubtask
    // =========================================================================

    #[Test]
    public function it_updates_the_subtask_title(): void
    {
        $subtask = Subtask::create([
            'task_id' => $this->task->id,
            'title' => 'Starý názov',
            'sort_order' => 1,
        ]);

        $this->service->updateSubtask($subtask->id, ['title' => 'Nový názov']);

        $this->assertDatabaseHas('subtasks', [
            'id' => $subtask->id,
            'title' => 'Nový názov',
        ]);
    }

    // =========================================================================
    // toggleSubtask
    // =========================================================================

    #[Test]
    public function it_toggles_is_completed_from_false_to_true(): void
    {
        $subtask = Subtask::create([
            'task_id' => $this->task->id,
            'title' => 'Podúloha',
            'is_completed' => false,
            'sort_order' => 1,
        ]);

        $result = $this->service->toggleSubtask($subtask->id);

        $this->assertTrue($result->is_completed);
    }

    #[Test]
    public function it_toggles_is_completed_from_true_to_false(): void
    {
        $subtask = Subtask::create([
            'task_id' => $this->task->id,
            'title' => 'Hotová podúloha',
            'is_completed' => true,
            'sort_order' => 1,
        ]);

        $result = $this->service->toggleSubtask($subtask->id);

        $this->assertFalse($result->is_completed);
    }

    // =========================================================================
    // deleteSubtask
    // =========================================================================

    #[Test]
    public function it_deletes_the_subtask(): void
    {
        $subtask = Subtask::create([
            'task_id' => $this->task->id,
            'title' => 'Na vymazanie',
            'sort_order' => 1,
        ]);

        $this->service->deleteSubtask($subtask->id);

        $this->assertDatabaseMissing('subtasks', ['id' => $subtask->id]);
    }
}
