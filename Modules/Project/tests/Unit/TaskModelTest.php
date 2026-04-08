<?php

namespace Modules\Project\Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TaskModelTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->project = Project::factory()->create(['owner_id' => $this->owner->id]);
    }

    // =========================================================================
    // Boot events – tasks_total
    // =========================================================================

    #[Test]
    public function creating_task_increments_project_tasks_total(): void
    {
        $this->assertEquals(0, $this->project->tasks_total);

        Task::factory()->create(['project_id' => $this->project->id]);

        $this->assertEquals(1, $this->project->fresh()->tasks_total);
    }

    #[Test]
    public function creating_multiple_tasks_increments_correctly(): void
    {
        Task::factory()->count(3)->create(['project_id' => $this->project->id]);

        $this->assertEquals(3, $this->project->fresh()->tasks_total);
    }

    #[Test]
    public function soft_deleting_task_decrements_project_tasks_total(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id]);
        $this->assertEquals(1, $this->project->fresh()->tasks_total);

        $task->delete();

        $this->assertEquals(0, $this->project->fresh()->tasks_total);
    }

    // =========================================================================
    // Boot events – tasks_completed
    // =========================================================================

    #[Test]
    public function updating_status_to_done_increments_tasks_completed(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id, 'status' => 'todo']);

        $task->update(['status' => 'done']);

        $this->assertEquals(1, $this->project->fresh()->tasks_completed);
    }

    #[Test]
    public function updating_status_from_done_decrements_tasks_completed(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id, 'status' => 'todo']);
        $task->update(['status' => 'done']);
        $this->assertEquals(1, $this->project->fresh()->tasks_completed);

        $task->update(['status' => 'in_progress']);

        $this->assertEquals(0, $this->project->fresh()->tasks_completed);
    }

    #[Test]
    public function updating_status_to_done_calls_update_progress(): void
    {
        Task::factory()->create(['project_id' => $this->project->id, 'status' => 'todo']);
        $task2 = Task::factory()->create(['project_id' => $this->project->id, 'status' => 'todo']);

        $task2->update(['status' => 'done']);

        $this->assertEquals(50, $this->project->fresh()->progress);
    }

    #[Test]
    public function updating_non_status_field_does_not_affect_tasks_completed(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id, 'status' => 'todo']);

        $task->update(['title' => 'Iný názov']);

        $this->assertEquals(0, $this->project->fresh()->tasks_completed);
    }

    // =========================================================================
    // isOverdue()
    // =========================================================================

    #[Test]
    public function is_overdue_returns_true_when_past_due_and_not_done(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'due_date' => now()->subDay(),
            'status' => 'todo',
        ]);

        $this->assertTrue($task->isOverdue());
    }

    #[Test]
    public function is_overdue_returns_false_when_status_is_done(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'due_date' => now()->subDay(),
            'status' => 'done',
        ]);

        $this->assertFalse($task->isOverdue());
    }

    #[Test]
    public function is_overdue_returns_false_when_due_date_is_in_future(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'due_date' => now()->addDay(),
            'status' => 'todo',
        ]);

        $this->assertFalse($task->isOverdue());
    }

    // =========================================================================
    // is_at_risk accessor
    // =========================================================================

    #[Test]
    public function is_at_risk_is_false_when_status_is_done(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'done',
        ]);

        $this->assertFalse($task->is_at_risk);
    }

    #[Test]
    public function is_at_risk_is_true_when_task_is_overdue(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'due_date' => now()->subDay(),
            'status' => 'todo',
        ]);

        $this->assertTrue($task->is_at_risk);
    }

    #[Test]
    public function is_at_risk_is_true_when_in_progress_and_stale(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'due_date' => now()->addMonth(),
        ]);

        // Simulate no update for 8 days
        Task::where('id', $task->id)->update(['updated_at' => now()->subDays(8)]);

        $this->assertTrue($task->fresh()->is_at_risk);
    }

    #[Test]
    public function is_at_risk_is_true_when_todo_and_due_within_3_days(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'todo',
            'due_date' => now()->addDays(2),
        ]);

        $this->assertTrue($task->is_at_risk);
    }

    #[Test]
    public function is_at_risk_is_false_for_healthy_task(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'due_date' => now()->addMonth(),
        ]);

        $this->assertFalse($task->is_at_risk);
    }

    // =========================================================================
    // at_risk_reason accessor
    // =========================================================================

    #[Test]
    public function at_risk_reason_is_null_when_done(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'done',
        ]);

        $this->assertNull($task->at_risk_reason);
    }

    #[Test]
    public function at_risk_reason_is_overdue_when_past_due(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'due_date' => now()->subDay(),
            'status' => 'todo',
        ]);

        $this->assertEquals('overdue', $task->at_risk_reason);
    }

    #[Test]
    public function at_risk_reason_is_stale_when_in_progress_inactive(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'in_progress',
            'due_date' => now()->addMonth(),
        ]);

        Task::where('id', $task->id)->update(['updated_at' => now()->subDays(8)]);

        $this->assertEquals('stale', $task->fresh()->at_risk_reason);
    }

    #[Test]
    public function at_risk_reason_is_no_progress_when_todo_near_deadline(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'status' => 'todo',
            'due_date' => now()->addDays(2),
        ]);

        $this->assertEquals('no_progress', $task->at_risk_reason);
    }

    // =========================================================================
    // Scopes
    // =========================================================================

    #[Test]
    public function scope_todo_returns_only_todo_tasks(): void
    {
        Task::factory()->create(['project_id' => $this->project->id, 'status' => 'todo']);
        Task::factory()->create(['project_id' => $this->project->id, 'status' => 'in_progress']);
        Task::factory()->create(['project_id' => $this->project->id, 'status' => 'done']);

        $results = Task::todo()->get();

        $this->assertCount(1, $results);
        $this->assertEquals('todo', $results->first()->status);
    }

    #[Test]
    public function scope_in_progress_returns_only_in_progress_tasks(): void
    {
        Task::factory()->create(['project_id' => $this->project->id, 'status' => 'todo']);
        Task::factory()->create(['project_id' => $this->project->id, 'status' => 'in_progress']);

        $results = Task::inProgress()->get();

        $this->assertCount(1, $results);
        $this->assertEquals('in_progress', $results->first()->status);
    }

    #[Test]
    public function scope_done_returns_only_done_tasks(): void
    {
        Task::factory()->create(['project_id' => $this->project->id, 'status' => 'todo']);
        Task::factory()->create(['project_id' => $this->project->id, 'status' => 'done']);

        $results = Task::done()->get();

        $this->assertCount(1, $results);
        $this->assertEquals('done', $results->first()->status);
    }

    #[Test]
    public function scope_overdue_returns_past_due_non_done_tasks(): void
    {
        // past due + todo → should be returned
        Task::factory()->create([
            'project_id' => $this->project->id,
            'due_date' => now()->subDay(),
            'status' => 'todo',
        ]);
        // past due + done → should NOT be returned
        Task::factory()->create([
            'project_id' => $this->project->id,
            'due_date' => now()->subDay(),
            'status' => 'done',
        ]);
        // future + todo → should NOT be returned
        Task::factory()->create([
            'project_id' => $this->project->id,
            'due_date' => now()->addDay(),
            'status' => 'todo',
        ]);

        $results = Task::overdue()->get();

        $this->assertCount(1, $results);
    }

    // =========================================================================
    // SoftDeletes
    // =========================================================================

    #[Test]
    public function soft_deleted_task_is_excluded_from_default_query(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id]);
        $task->delete();

        $this->assertNull(Task::find($task->id));
    }

    #[Test]
    public function soft_deleted_task_can_be_retrieved_with_with_trashed(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id]);
        $task->delete();

        $this->assertNotNull(Task::withTrashed()->find($task->id));
    }
}
