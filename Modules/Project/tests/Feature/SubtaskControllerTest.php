<?php

namespace Modules\Project\Tests\Feature;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Models\Project;
use Modules\Project\Models\Subtask;
use Modules\Project\Models\Task;
use Modules\Project\Tests\Concerns\HasProjectHelpers;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SubtaskControllerTest extends TestCase
{
    use RefreshDatabase, HasProjectHelpers;

    private User $owner;
    private Project $project;
    private Task $task;
    private Subtask $subtask;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(PermissionSeeder::class);

        $this->owner = User::factory()->create();
        $this->project = $this->createProject($this->owner);
        $this->task = Task::factory()->create(['project_id' => $this->project->id]);
        $this->subtask = Subtask::create([
            'task_id' => $this->task->id,
            'title' => 'Pôvodná podúloha',
            'is_completed' => false,
            'sort_order' => 1,
        ]);
    }

    private function storeUrl(): string
    {
        return "/projects/{$this->project->id}/tasks/{$this->task->id}/subtasks";
    }

    private function subtaskUrl(Subtask $subtask): string
    {
        return "/projects/{$this->project->id}/tasks/{$this->task->id}/subtasks/{$subtask->id}";
    }

    private function toggleUrl(Subtask $subtask): string
    {
        return "/projects/{$this->project->id}/tasks/{$this->task->id}/subtasks/{$subtask->id}/toggle";
    }

    // =========================================================================
    // store
    // =========================================================================

    #[Test]
    public function owner_can_create_subtask(): void
    {
        $this->actingAs($this->owner)
            ->post($this->storeUrl(), ['title' => 'Nová podúloha'])
            ->assertRedirect();

        $this->assertDatabaseHas('subtasks', [
            'task_id' => $this->task->id,
            'title' => 'Nová podúloha',
        ]);
    }

    #[Test]
    public function member_with_edit_tasks_can_create_subtask(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['edit_tasks']);

        $this->actingAs($member)
            ->post($this->storeUrl(), ['title' => 'Podúloha člena'])
            ->assertRedirect();
    }

    #[Test]
    public function member_without_edit_tasks_gets_403_on_store(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['view_tasks']);

        $this->actingAs($member)
            ->post($this->storeUrl(), ['title' => 'Odmietnutá'])
            ->assertForbidden();
    }

    #[Test]
    public function store_fails_when_title_is_missing(): void
    {
        $this->actingAs($this->owner)
            ->post($this->storeUrl(), ['title' => ''])
            ->assertSessionHasErrors('title');
    }

    #[Test]
    public function sort_order_auto_increments_for_each_new_subtask(): void
    {
        $this->actingAs($this->owner)
            ->post($this->storeUrl(), ['title' => 'Druhá podúloha']);

        $second = Subtask::where('task_id', $this->task->id)
            ->where('title', 'Druhá podúloha')
            ->first();

        $this->assertEquals(2, $second->sort_order);
    }

    // =========================================================================
    // update
    // =========================================================================

    #[Test]
    public function owner_can_update_subtask_title(): void
    {
        $this->actingAs($this->owner)
            ->put($this->subtaskUrl($this->subtask), ['title' => 'Zmenený názov'])
            ->assertRedirect();

        $this->assertDatabaseHas('subtasks', [
            'id' => $this->subtask->id,
            'title' => 'Zmenený názov',
        ]);
    }

    #[Test]
    public function member_without_edit_tasks_gets_403_on_update(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['view_tasks']);

        $this->actingAs($member)
            ->put($this->subtaskUrl($this->subtask), ['title' => 'Pokus'])
            ->assertForbidden();
    }

    // =========================================================================
    // toggle
    // =========================================================================

    #[Test]
    public function toggle_marks_incomplete_subtask_as_completed(): void
    {
        $this->assertFalse($this->subtask->is_completed);

        $this->actingAs($this->owner)
            ->patch($this->toggleUrl($this->subtask))
            ->assertRedirect();

        $this->assertTrue($this->subtask->fresh()->is_completed);
    }

    #[Test]
    public function toggle_marks_completed_subtask_as_incomplete(): void
    {
        $completed = Subtask::create([
            'task_id' => $this->task->id,
            'title' => 'Hotová',
            'is_completed' => true,
            'sort_order' => 2,
        ]);

        $this->actingAs($this->owner)
            ->patch($this->toggleUrl($completed))
            ->assertRedirect();

        $this->assertFalse($completed->fresh()->is_completed);
    }

    #[Test]
    public function member_without_edit_tasks_gets_403_on_toggle(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['view_tasks']);

        $this->actingAs($member)
            ->patch($this->toggleUrl($this->subtask))
            ->assertForbidden();
    }

    // =========================================================================
    // destroy
    // =========================================================================

    #[Test]
    public function owner_can_delete_subtask(): void
    {
        $this->actingAs($this->owner)
            ->delete($this->subtaskUrl($this->subtask))
            ->assertRedirect();

        $this->assertDatabaseMissing('subtasks', ['id' => $this->subtask->id]);
    }

    #[Test]
    public function member_without_edit_tasks_gets_403_on_destroy(): void
    {
        $member = User::factory()->create();
        $this->attachMember($this->project, $member, ['view_tasks']);

        $this->actingAs($member)
            ->delete($this->subtaskUrl($this->subtask))
            ->assertForbidden();
    }
}
