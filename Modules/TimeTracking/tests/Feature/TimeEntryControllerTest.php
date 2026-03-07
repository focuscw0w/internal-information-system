<?php

namespace Modules\TimeTracking\Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use App\Models\User;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Models\TimeEntry;

class TimeEntryControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $member;
    private Project $project;
    private Task $task;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->owner = User::factory()->create();
        $this->member = User::factory()->create();

        $this->project = Project::factory()->create(['owner_id' => $this->owner->id]);

        $this->project->team()->attach($this->member->id, [
            'permissions' => json_encode(['view_project', 'view_tasks', 'edit_tasks']),
        ]);

        $this->project->team()->attach($this->owner->id, [
            'permissions' => json_encode(['view_project', 'view_tasks', 'edit_tasks', 'manage_team']),
        ]);

        $this->task = Task::factory()->create([
            'project_id' => $this->project->id,
            'actual_hours' => 0,
        ]);

        $this->task->assignedUsers()->attach($this->member->id);
    }

    // ── INDEX ────────────────────────────────────────────────

    #[Test]
    public function owner_can_see_all_time_entries(): void
    {
        TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->owner->id,
        ]);

        TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->get("/projects/{$this->project->id}/time-entries");

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
        $page->component('TimeTracking/TimeEntry', false)
            ->has('entries', 2)
        );
    }

    #[Test]
    public function member_can_only_see_own_time_entries(): void
    {
        TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->owner->id,
        ]);

        TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
        ]);

        $response = $this->actingAs($this->member)
            ->get("/projects/{$this->project->id}/time-entries");

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
        $page->component('TimeTracking/TimeEntry', false)
            ->has('entries', 1)
        );
    }

    #[Test]
    public function guest_cannot_access_time_entries(): void
    {
        $response = $this->get("/projects/{$this->project->id}/time-entries");

        $response->assertRedirect('/login');
    }

    // ── STORE ───────────────────────────────────────────────

    #[Test]
    public function user_can_create_time_entry(): void
    {
        $response = $this->actingAs($this->member)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
                'hours' => 3.5,
                'description' => 'Worked on feature',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('time_entries', [
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'hours' => 3.5,
        ]);
    }

    #[Test]
    public function it_syncs_task_hours_after_create(): void
    {
        $this->actingAs($this->member)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
                'hours' => 4.0,
            ]);

        $this->task->refresh();
        $this->assertEquals(4.0, $this->task->actual_hours);
    }

    #[Test]
    public function it_validates_required_fields(): void
    {
        $response = $this->actingAs($this->member)
            ->post("/projects/{$this->project->id}/time-entries", []);

        $response->assertSessionHasErrors(['task_id', 'entry_date', 'hours']);
    }

    #[Test]
    public function it_validates_hours_range(): void
    {
        $response = $this->actingAs($this->member)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
                'hours' => 0.1,
            ]);

        $response->assertSessionHasErrors('hours');

        $response = $this->actingAs($this->member)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
                'hours' => 25,
            ]);

        $response->assertSessionHasErrors('hours');
    }

    #[Test]
    public function it_validates_task_exists(): void
    {
        $response = $this->actingAs($this->member)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => 9999,
                'entry_date' => '2026-03-07',
                'hours' => 2.0,
            ]);

        $response->assertSessionHasErrors('task_id');
    }

    #[Test]
    public function member_cannot_log_time_on_unassigned_task(): void
    {
        $unassignedTask = Task::factory()->create([
            'project_id' => $this->project->id,
        ]);

        $response = $this->actingAs($this->member)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $unassignedTask->id,
                'entry_date' => '2026-03-07',
                'hours' => 2.0,
            ]);

        $response->assertSessionHasErrors('task_id');
    }

    #[Test]
    public function manager_can_log_time_on_any_task(): void
    {
        $unassignedTask = Task::factory()->create([
            'project_id' => $this->project->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->post("/projects/{$this->project->id}/time-entries", [
                'task_id' => $unassignedTask->id,
                'entry_date' => '2026-03-07',
                'hours' => 2.0,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    // ── UPDATE ──────────────────────────────────────────────

    #[Test]
    public function user_can_update_own_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'hours' => 2.0,
        ]);

        $response = $this->actingAs($this->member)
            ->put("/projects/{$this->project->id}/time-entries/{$entry->id}", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
                'hours' => 4.0,
                'description' => 'Updated',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $entry->refresh();
        $this->assertEquals(4.0, $entry->hours);
    }

    #[Test]
    public function member_cannot_update_others_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->owner->id,
            'hours' => 2.0,
        ]);

        $response = $this->actingAs($this->member)
            ->put("/projects/{$this->project->id}/time-entries/{$entry->id}", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
                'hours' => 4.0,
            ]);

        $response->assertForbidden();
    }

    #[Test]
    public function manager_can_update_others_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'hours' => 2.0,
        ]);

        $response = $this->actingAs($this->owner)
            ->put("/projects/{$this->project->id}/time-entries/{$entry->id}", [
                'task_id' => $this->task->id,
                'entry_date' => '2026-03-07',
                'hours' => 6.0,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    // ── DELETE ──────────────────────────────────────────────

    #[Test]
    public function user_can_delete_own_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
        ]);

        $response = $this->actingAs($this->member)
            ->delete("/projects/{$this->project->id}/time-entries/{$entry->id}");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('time_entries', ['id' => $entry->id]);
    }

    #[Test]
    public function member_cannot_delete_others_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->owner->id,
        ]);

        $response = $this->actingAs($this->member)
            ->delete("/projects/{$this->project->id}/time-entries/{$entry->id}");

        $response->assertForbidden();
    }

    #[Test]
    public function manager_can_delete_others_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->delete("/projects/{$this->project->id}/time-entries/{$entry->id}");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('time_entries', ['id' => $entry->id]);
    }

    #[Test]
    public function it_syncs_task_hours_after_delete(): void
    {
        $entry1 = TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'hours' => 3.0,
        ]);

        TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'hours' => 2.0,
        ]);

        $this->task->update(['actual_hours' => 5.0]);

        $this->actingAs($this->member)
            ->delete("/projects/{$this->project->id}/time-entries/{$entry1->id}");

        $this->task->refresh();
        $this->assertEquals(2.0, $this->task->actual_hours);
    }

    // ── DASHBOARD ───────────────────────────────────────────

    #[Test]
    public function user_can_access_time_tracking_dashboard(): void
    {
        $response = $this->actingAs($this->member)
            ->get('/time-tracking');

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
        $page->component('TimeTracking/Index', false)
            ->has('projects')
            ->has('entries')
        );
    }

    #[Test]
    public function dashboard_shows_only_own_entries(): void
    {
        TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
        ]);

        TimeEntry::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'user_id' => $this->owner->id,
        ]);

        $response = $this->actingAs($this->member)
            ->get('/time-tracking');

        $response->assertInertia(fn ($page) =>
        $page->has('entries', 1)
        );
    }
}
