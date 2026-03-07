<?php

namespace Modules\TimeTracking\Tests\Unit;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\TimeTracking\Services\TimeEntryService;

class TimeEntryServiceTest extends TestCase
{
    use RefreshDatabase;

    private TimeEntryService $service;
    private User $user;
    private Project $project;
    private Task $task;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new TimeEntryService();
        $this->user = User::factory()->create();
        $this->project = Project::factory()->create(['owner_id' => $this->user->id]);
        $this->task = Task::factory()->create([
            'project_id' => $this->project->id,
            'actual_hours' => 0,
        ]);
    }

    #[Test]
    public function it_creates_a_time_entry(): void
    {
        $entry = $this->service->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
            'entry_date' => '2026-03-07',
            'hours' => 2.5,
            'description' => 'Test entry',
        ]);

        $this->assertInstanceOf(TimeEntry::class, $entry);
        $this->assertDatabaseHas('time_entries', [
            'id' => $entry->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
            'hours' => 2.5,
        ]);
    }

    #[Test]
    public function it_syncs_task_actual_hours_on_create(): void
    {
        $this->service->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
            'entry_date' => '2026-03-07',
            'hours' => 3.0,
        ]);

        $this->service->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
            'entry_date' => '2026-03-08',
            'hours' => 2.0,
        ]);

        $this->task->refresh();
        $this->assertEquals(5.0, $this->task->actual_hours);
    }

    #[Test]
    public function it_syncs_task_actual_hours_on_update(): void
    {
        $entry = $this->service->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
            'entry_date' => '2026-03-07',
            'hours' => 3.0,
        ]);

        $this->actingAs($this->user);

        $this->service->update($entry->id, [
            'hours' => 5.0,
        ]);

        $this->task->refresh();
        $this->assertEquals(5.0, $this->task->actual_hours);
    }

    #[Test]
    public function it_syncs_task_actual_hours_on_delete(): void
    {
        $entry1 = $this->service->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
            'entry_date' => '2026-03-07',
            'hours' => 3.0,
        ]);

        $this->service->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
            'entry_date' => '2026-03-08',
            'hours' => 2.0,
        ]);

        $this->actingAs($this->user);

        $this->service->delete($entry1->id);

        $this->task->refresh();
        $this->assertEquals(2.0, $this->task->actual_hours);
    }

    #[Test]
    public function it_syncs_both_tasks_when_task_changes_on_update(): void
    {
        $task2 = Task::factory()->create([
            'project_id' => $this->project->id,
            'actual_hours' => 0,
        ]);

        $entry = $this->service->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
            'entry_date' => '2026-03-07',
            'hours' => 4.0,
        ]);

        $this->actingAs($this->user);

        $this->service->update($entry->id, [
            'task_id' => $task2->id,
        ]);

        $this->task->refresh();
        $task2->refresh();

        $this->assertEquals(0, $this->task->actual_hours);
        $this->assertEquals(4.0, $task2->actual_hours);
    }

    #[Test]
    public function it_returns_entries_by_project(): void
    {
        TimeEntry::factory()->count(3)->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
        ]);

        $otherProject = Project::factory()->create();
        TimeEntry::factory()->count(2)->create([
            'project_id' => $otherProject->id,
            'task_id' => Task::factory()->create(['project_id' => $otherProject->id])->id,
            'user_id' => $this->user->id,
        ]);

        $entries = $this->service->getByProject($this->project->id);

        $this->assertCount(3, $entries);
    }

    #[Test]
    public function it_filters_entries_by_user(): void
    {
        $otherUser = User::factory()->create();

        TimeEntry::factory()->count(2)->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
        ]);

        TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $otherUser->id,
        ]);

        $entries = $this->service->getByProject($this->project->id, [
            'user_id' => $this->user->id,
        ]);

        $this->assertCount(2, $entries);
    }

    #[Test]
    public function it_filters_entries_by_task(): void
    {
        $task2 = Task::factory()->create(['project_id' => $this->project->id]);

        TimeEntry::factory()->count(2)->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
        ]);

        TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $task2->id,
            'user_id' => $this->user->id,
        ]);

        $entries = $this->service->getByProject($this->project->id, [
            'task_id' => $this->task->id,
        ]);

        $this->assertCount(2, $entries);
    }

    #[Test]
    public function it_filters_entries_by_date_range(): void
    {
        TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
            'entry_date' => '2026-03-01',
        ]);

        TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
            'entry_date' => '2026-03-05',
        ]);

        TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
            'entry_date' => '2026-03-10',
        ]);

        $entries = $this->service->getByProject($this->project->id, [
            'date_from' => '2026-03-03',
            'date_to' => '2026-03-07',
        ]);

        $this->assertCount(1, $entries);
    }

    #[Test]
    public function it_returns_entries_by_task(): void
    {
        TimeEntry::factory()->count(2)->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->user->id,
        ]);

        $entries = $this->service->getByTask($this->task->id);

        $this->assertCount(2, $entries);
    }
}
