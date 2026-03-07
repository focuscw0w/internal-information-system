<?php

namespace Modules\TimeTracking\Tests\Feature;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;

class StoreTimeEntryValidationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Project $project;
    private Task $task;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->project = Project::factory()->create(['owner_id' => $this->user->id]);

        $this->project->team()->attach($this->user->id, [
            'permissions' => json_encode(['view_project', 'view_tasks', 'edit_tasks', 'manage_team']),
        ]);

        $this->task = Task::factory()->create([
            'project_id' => $this->project->id,
        ]);

        $this->task->assignedUsers()->attach($this->user->id);
    }

    #[Test]
    public function task_id_is_required(): void
    {
        $response = $this->actingAs($this->user)
            ->post("/projects/{$this->project->id}/time-entries", [
                'entry_date' => '2026-03-07',
                'hours' => 2.0,
            ]);

        $response->assertSessionHasErrors('task_id');
    }

    #[Test]
    public function task_id_must_exist(): void
    {
        $response = $this->actingAs($this->user)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => 99999,
                'entry_date' => '2026-03-07',
                'hours' => 2.0,
            ]);

        $response->assertSessionHasErrors('task_id');
    }

    #[Test]
    public function entry_date_is_required(): void
    {
        $response = $this->actingAs($this->user)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $this->task->id,
                'hours' => 2.0,
            ]);

        $response->assertSessionHasErrors('entry_date');
    }

    #[Test]
    public function entry_date_must_be_valid_date(): void
    {
        $response = $this->actingAs($this->user)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $this->task->id,
                'entry_date' => 'not-a-date',
                'hours' => 2.0,
            ]);

        $response->assertSessionHasErrors('entry_date');
    }

    #[Test]
    public function hours_is_required(): void
    {
        $response = $this->actingAs($this->user)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
            ]);

        $response->assertSessionHasErrors('hours');
    }

    #[Test]
    public function hours_minimum_is_025(): void
    {
        $response = $this->actingAs($this->user)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
                'hours' => 0.1,
            ]);

        $response->assertSessionHasErrors('hours');
    }

    #[Test]
    public function hours_maximum_is_24(): void
    {
        $response = $this->actingAs($this->user)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
                'hours' => 25,
            ]);

        $response->assertSessionHasErrors('hours');
    }

    #[Test]
    public function hours_must_be_numeric(): void
    {
        $response = $this->actingAs($this->user)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
                'hours' => 'abc',
            ]);

        $response->assertSessionHasErrors('hours');
    }

    #[Test]
    public function description_is_optional(): void
    {
        $response = $this->actingAs($this->user)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
                'hours' => 2.0,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function description_max_length_is_1000(): void
    {
        $response = $this->actingAs($this->user)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
                'hours' => 2.0,
                'description' => str_repeat('a', 1001),
            ]);

        $response->assertSessionHasErrors('description');
    }

    #[Test]
    public function valid_entry_passes_validation(): void
    {
        $response = $this->actingAs($this->user)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
                'hours' => 4.5,
                'description' => 'Worked on feature X',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }
}
