<?php

namespace Modules\TimeTracking\Tests\Feature;

use App\Enums\PermissionEnum;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Enums\TimeEntryStatusEnum;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ManagerTimeWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $manager;

    private User $member;

    private Project $managedProject;

    private Project $otherProject;

    private Task $managedTask;

    private Task $otherTask;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(PermissionSeeder::class);

        $this->manager = User::factory()->create();
        $this->member = User::factory()->create();

        $this->managedProject = Project::factory()->create();
        $this->managedProject->team()->attach($this->manager->id, [
            'permissions' => json_encode([
                'view_project',
                'view_tasks',
                'manage_team',
                'manage_time_entries',
                'view_all_time_entries',
            ]),
            'allocation' => 100,
        ]);

        $this->otherProject = Project::factory()->create();

        $this->managedTask = Task::factory()->create([
            'project_id' => $this->managedProject->id,
        ]);
        $this->otherTask = Task::factory()->create([
            'project_id' => $this->otherProject->id,
        ]);
    }

    #[Test]
    public function manager_dashboard_requires_a_manager_permission(): void
    {
        $regular = User::factory()->create();

        $this->actingAs($regular)
            ->get('/manager')
            ->assertForbidden();

        $this->actingAs($this->manager)
            ->get('/manager')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('manager/Dashboard', false)
                ->has('widgets.pendingApprovals')
            );
    }

    #[Test]
    public function admin_can_open_approvals_queue(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $this->actingAs($admin)
            ->get('/manager/time/approvals')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('TimeTracking/manager/Approvals', false)
                ->has('entries.data', 1)
                ->where('entries.data.0.project_id', $this->managedProject->id)
            );
    }

    #[Test]
    public function regular_project_member_cannot_access_manager_dashboard_or_reports(): void
    {
        $regularMember = User::factory()->create();

        $this->managedProject->team()->attach($regularMember->id, [
            'permissions' => json_encode([
                'view_project',
                'view_tasks',
                'edit_tasks',
            ]),
            'allocation' => 100,
        ]);

        $this->actingAs($regularMember)
            ->get('/manager')
            ->assertForbidden();

        $this->actingAs($regularMember)
            ->get('/manager/time/reports')
            ->assertForbidden();

        $this->actingAs($regularMember)
            ->getJson('/manager/time/reports/data')
            ->assertForbidden();

        $this->actingAs($regularMember)
            ->get('/manager/time/reports/export')
            ->assertForbidden();
    }

    #[Test]
    public function project_time_viewer_cannot_access_manager_dashboard(): void
    {
        $timeViewer = User::factory()->create();

        $this->managedProject->team()->attach($timeViewer->id, [
            'permissions' => json_encode([
                'view_project',
                'view_tasks',
                'view_team',
                'view_all_time_entries',
            ]),
            'allocation' => 100,
        ]);

        $this->actingAs($timeViewer)
            ->get('/manager')
            ->assertForbidden();

        $this->actingAs($timeViewer)
            ->get('/manager/time/reports')
            ->assertForbidden();

        $this->actingAs($timeViewer)
            ->getJson('/manager/time/reports/data')
            ->assertForbidden();

        $this->actingAs($timeViewer)
            ->get('/manager/time/reports/export')
            ->assertForbidden();

        $this->actingAs($timeViewer)
            ->get('/manager/time/approvals')
            ->assertForbidden();
    }

    #[Test]
    public function manage_team_member_can_access_manager_dashboard_but_not_time_reports(): void
    {
        $teamManager = User::factory()->create();

        $this->managedProject->team()->attach($teamManager->id, [
            'permissions' => json_encode([
                'view_project',
                'view_tasks',
                'manage_team',
            ]),
            'allocation' => 100,
        ]);

        $this->actingAs($teamManager)
            ->get('/manager')
            ->assertOk();

        $this->actingAs($teamManager)
            ->get('/manager/time/reports')
            ->assertForbidden();
    }

    #[Test]
    public function approvals_queue_only_lists_entries_from_projects_the_user_can_manage(): void
    {
        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        TimeEntry::factory()->create([
            'project_id' => $this->otherProject->id,
            'task_id' => $this->otherTask->id,
            'user_id' => $this->member->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $this->actingAs($this->manager)
            ->get('/manager/time/approvals')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('TimeTracking/manager/Approvals', false)
                ->has('entries.data', 1)
                ->where('entries.data.0.project_id', $this->managedProject->id)
            );
    }

    #[Test]
    public function manager_can_approve_an_entry_they_manage(): void
    {
        $entry = TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $this->actingAs($this->manager)
            ->post("/manager/time/approvals/{$entry->id}/approve")
            ->assertRedirect();

        $this->assertDatabaseHas('time_entries', [
            'id' => $entry->id,
            'status' => TimeEntryStatusEnum::Approved->value,
            'approved_by' => $this->manager->id,
            'rejection_reason' => null,
        ]);

        $this->assertNotNull($entry->fresh()->approved_at);
    }

    #[Test]
    public function manager_cannot_approve_their_own_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->manager->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $this->actingAs($this->manager)
            ->post("/manager/time/approvals/{$entry->id}/approve")
            ->assertForbidden();

        $this->assertDatabaseHas('time_entries', [
            'id' => $entry->id,
            'status' => TimeEntryStatusEnum::Pending->value,
            'approved_by' => null,
        ]);
    }

    #[Test]
    public function reject_requires_a_reason_and_stores_rejection_state(): void
    {
        $entry = TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $this->actingAs($this->manager)
            ->post("/manager/time/approvals/{$entry->id}/reject", [])
            ->assertSessionHasErrors('rejection_reason');

        $this->actingAs($this->manager)
            ->post("/manager/time/approvals/{$entry->id}/reject", [
                'rejection_reason' => 'Nesedí popis práce.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('time_entries', [
            'id' => $entry->id,
            'status' => TimeEntryStatusEnum::Rejected->value,
            'approved_by' => null,
            'approved_at' => null,
            'rejection_reason' => 'Nesedí popis práce.',
        ]);
    }

    #[Test]
    public function bulk_approve_fails_atomically_when_any_entry_is_not_manageable(): void
    {
        $validEntry = TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);
        $invalidEntry = TimeEntry::factory()->create([
            'project_id' => $this->otherProject->id,
            'task_id' => $this->otherTask->id,
            'user_id' => $this->member->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $this->actingAs($this->manager)
            ->postJson('/manager/time/approvals/bulk', [
                'ids' => [$validEntry->id, $invalidEntry->id],
            ])
            ->assertForbidden()
            ->assertJsonPath('problematic_ids.0', $invalidEntry->id);

        $this->assertDatabaseHas('time_entries', [
            'id' => $validEntry->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);
        $this->assertDatabaseHas('time_entries', [
            'id' => $invalidEntry->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);
    }

    #[Test]
    public function reports_are_scoped_to_managed_projects_without_view_all(): void
    {
        $this->managedProject->team()->updateExistingPivot($this->manager->id, [
            'permissions' => json_encode([
                'view_project',
                'view_tasks',
                'manage_time_entries',
            ]),
        ]);

        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'entry_date' => now()->toDateString(),
            'hours' => 2,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);
        TimeEntry::factory()->create([
            'project_id' => $this->otherProject->id,
            'task_id' => $this->otherTask->id,
            'user_id' => $this->member->id,
            'entry_date' => now()->toDateString(),
            'hours' => 9,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);

        $this->actingAs($this->manager)
            ->getJson('/manager/time/reports/data?status=approved')
            ->assertOk()
            ->assertJsonCount(1, 'byProject')
            ->assertJsonPath('byProject.0.project_id', $this->managedProject->id)
            ->assertJsonPath('byProject.0.total_hours', 2);
    }

    #[Test]
    public function owner_reports_are_scoped_to_owned_projects(): void
    {
        $owner = User::factory()->create();
        $ownedProject = Project::factory()->create(['owner_id' => $owner->id]);
        $ownedTask = Task::factory()->create(['project_id' => $ownedProject->id]);

        TimeEntry::factory()->create([
            'project_id' => $ownedProject->id,
            'task_id' => $ownedTask->id,
            'user_id' => $this->member->id,
            'entry_date' => now()->toDateString(),
            'hours' => 4,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);

        TimeEntry::factory()->create([
            'project_id' => $this->otherProject->id,
            'task_id' => $this->otherTask->id,
            'user_id' => $this->member->id,
            'entry_date' => now()->toDateString(),
            'hours' => 8,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);

        $this->actingAs($owner)
            ->getJson('/manager/time/reports/data?status=approved')
            ->assertOk()
            ->assertJsonCount(1, 'byProject')
            ->assertJsonPath('byProject.0.project_id', $ownedProject->id)
            ->assertJsonPath('byProject.0.total_hours', 4);
    }

    #[Test]
    public function reports_csv_export_includes_utf8_bom(): void
    {
        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'entry_date' => now()->toDateString(),
            'hours' => 2,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);

        $response = $this->actingAs($this->manager)
            ->get('/manager/time/reports/export?tab=users&status=approved');

        $response->assertOk();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $response->streamedContent());
    }

    #[Test]
    public function manager_cannot_approve_entry_from_unmanaged_project(): void
    {
        $entry = TimeEntry::factory()->create([
            'project_id' => $this->otherProject->id,
            'task_id' => $this->otherTask->id,
            'user_id' => $this->member->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $this->actingAs($this->manager)
            ->post("/manager/time/approvals/{$entry->id}/approve")
            ->assertForbidden();

        $this->assertDatabaseHas('time_entries', [
            'id' => $entry->id,
            'status' => TimeEntryStatusEnum::Pending->value,
            'approved_by' => null,
        ]);
    }

    #[Test]
    public function admin_can_approve_entry_in_any_project(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $entry = TimeEntry::factory()->create([
            'project_id' => $this->otherProject->id,
            'task_id' => $this->otherTask->id,
            'user_id' => $this->member->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $this->actingAs($admin)
            ->post("/manager/time/approvals/{$entry->id}/approve")
            ->assertRedirect();

        $this->assertDatabaseHas('time_entries', [
            'id' => $entry->id,
            'status' => TimeEntryStatusEnum::Approved->value,
            'approved_by' => $admin->id,
        ]);
    }

    #[Test]
    public function user_with_global_manage_permission_cannot_approve_outside_project_scope(): void
    {
        Permission::firstOrCreate(['name' => 'manage_time_entries', 'guard_name' => 'web']);

        $globalManager = User::factory()->create();
        $globalManager->givePermissionTo('manage_time_entries');

        $entry = TimeEntry::factory()->create([
            'project_id' => $this->otherProject->id,
            'task_id' => $this->otherTask->id,
            'user_id' => $this->member->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $this->actingAs($globalManager)
            ->post("/manager/time/approvals/{$entry->id}/approve")
            ->assertForbidden();

        $this->assertDatabaseHas('time_entries', [
            'id' => $entry->id,
            'status' => TimeEntryStatusEnum::Pending->value,
            'approved_by' => null,
        ]);
    }

    #[Test]
    public function project_view_all_user_cannot_approve_foreign_time_entry(): void
    {
        $viewer = User::factory()->create();
        $viewer->givePermissionTo(PermissionEnum::PROJECTS_VIEW_ALL->value);

        $entry = TimeEntry::factory()->create([
            'project_id' => $this->otherProject->id,
            'task_id' => $this->otherTask->id,
            'user_id' => $this->member->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $this->actingAs($viewer)
            ->post("/manager/time/approvals/{$entry->id}/approve")
            ->assertForbidden();

        $this->assertDatabaseHas('time_entries', [
            'id' => $entry->id,
            'status' => TimeEntryStatusEnum::Pending->value,
            'approved_by' => null,
        ]);
    }

    #[Test]
    public function bulk_approve_succeeds_when_all_entries_manageable(): void
    {
        $entries = TimeEntry::factory()->count(3)->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $this->actingAs($this->manager)
            ->postJson('/manager/time/approvals/bulk', [
                'ids' => $entries->pluck('id')->all(),
            ])
            ->assertRedirect();

        foreach ($entries as $entry) {
            $this->assertDatabaseHas('time_entries', [
                'id' => $entry->id,
                'status' => TimeEntryStatusEnum::Approved->value,
                'approved_by' => $this->manager->id,
                'rejection_reason' => null,
            ]);
            $this->assertNotNull($entry->fresh()->approved_at);
        }
    }

    #[Test]
    public function approvals_index_respects_filters(): void
    {
        $memberA = $this->member;
        $memberB = User::factory()->create();

        $entryA = TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $memberA->id,
            'entry_date' => '2026-04-15',
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);
        $entryB = TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $memberB->id,
            'entry_date' => '2026-04-15',
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);
        $entryC = TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $memberA->id,
            'entry_date' => '2026-03-01',
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $this->actingAs($this->manager)
            ->get('/manager/time/approvals?user_id='.$memberA->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('TimeTracking/manager/Approvals', false)
                ->has('entries.data', 2)
            );

        $this->actingAs($this->manager)
            ->get('/manager/time/approvals?date_from=2026-04-01&date_to=2026-04-30')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('entries.data', 2));

        $this->actingAs($this->manager)
            ->get('/manager/time/approvals?user_id='.$memberA->id.'&date_from=2026-04-01&date_to=2026-04-30')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('entries.data', 1)
                ->where('entries.data.0.id', $entryA->id)
            );
    }

    #[Test]
    public function reject_rejects_reason_longer_than_500_chars(): void
    {
        $entry = TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $this->actingAs($this->manager)
            ->post("/manager/time/approvals/{$entry->id}/reject", [
                'rejection_reason' => str_repeat('a', 501),
            ])
            ->assertSessionHasErrors('rejection_reason');

        $this->assertDatabaseHas('time_entries', [
            'id' => $entry->id,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);
    }

    #[Test]
    public function bulk_approve_validates_payload(): void
    {
        $this->actingAs($this->manager)
            ->postJson('/manager/time/approvals/bulk', ['ids' => []])
            ->assertStatus(422)
            ->assertJsonValidationErrors('ids');

        $this->actingAs($this->manager)
            ->postJson('/manager/time/approvals/bulk', ['ids' => [999999]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('ids.0');
    }

    #[Test]
    public function reports_data_respects_status_filter(): void
    {
        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'entry_date' => now()->toDateString(),
            'hours' => 1,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);
        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'entry_date' => now()->toDateString(),
            'hours' => 2,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);
        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'entry_date' => now()->toDateString(),
            'hours' => 3,
            'status' => TimeEntryStatusEnum::Rejected->value,
        ]);

        $this->actingAs($this->manager)
            ->getJson('/manager/time/reports/data?status=approved')
            ->assertOk()
            ->assertJsonCount(1, 'byProject')
            ->assertJsonPath('byProject.0.entries_count', 1)
            ->assertJsonPath('byProject.0.total_hours', 2);

        $this->actingAs($this->manager)
            ->getJson('/manager/time/reports/data?status=pending')
            ->assertOk()
            ->assertJsonPath('byProject.0.entries_count', 1)
            ->assertJsonPath('byProject.0.total_hours', 1);

        $this->actingAs($this->manager)
            ->getJson('/manager/time/reports/data?status=all')
            ->assertOk()
            ->assertJsonPath('byProject.0.entries_count', 3)
            ->assertJsonPath('byProject.0.total_hours', 6);
    }

    #[Test]
    public function reports_data_respects_date_range_and_user_filters(): void
    {
        $memberA = $this->member;
        $memberB = User::factory()->create();

        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $memberA->id,
            'entry_date' => '2026-04-10',
            'hours' => 2,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);
        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $memberB->id,
            'entry_date' => '2026-04-20',
            'hours' => 3,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);
        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $memberA->id,
            'entry_date' => '2026-05-15',
            'hours' => 4,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);

        $this->actingAs($this->manager)
            ->getJson('/manager/time/reports/data?status=approved&date_from=2026-04-01&date_to=2026-04-30')
            ->assertOk()
            ->assertJsonCount(2, 'byUser')
            ->assertJsonPath('byProject.0.total_hours', 5);

        $this->actingAs($this->manager)
            ->getJson('/manager/time/reports/data?status=approved&date_from=2026-04-01&date_to=2026-05-31&user_ids[]='.$memberA->id)
            ->assertOk()
            ->assertJsonCount(1, 'byUser')
            ->assertJsonPath('byUser.0.user_id', $memberA->id)
            ->assertJsonPath('byUser.0.total_hours', 6);
    }

    #[Test]
    public function csv_export_users_tab_returns_correct_columns_and_aggregates(): void
    {
        $secondTask = Task::factory()->create([
            'project_id' => $this->managedProject->id,
        ]);

        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'entry_date' => '2026-04-10',
            'hours' => 2.5,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);
        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $secondTask->id,
            'user_id' => $this->member->id,
            'entry_date' => '2026-04-15',
            'hours' => 1.5,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);

        $response = $this->actingAs($this->manager)
            ->get('/manager/time/reports/export?tab=users&status=approved&date_from=2026-04-01&date_to=2026-04-30');

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('charset=UTF-8', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment', $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('time-report-users-', $response->headers->get('Content-Disposition'));

        $rows = $this->parseCsvRows($response->streamedContent());

        $this->assertSame(['Osoba', 'Hodiny', 'Počet záznamov', 'Počet projektov'], $rows[0]);
        $this->assertSame($this->member->name, $rows[1][0]);
        $this->assertSame('4', $rows[1][1]);
        $this->assertSame('2', $rows[1][2]);
        $this->assertSame('1', $rows[1][3]);
    }

    #[Test]
    public function csv_export_projects_tab_includes_top_contributors_column(): void
    {
        $contributorA = User::factory()->create(['name' => 'Alica Test']);
        $contributorB = User::factory()->create(['name' => 'Boris Test']);

        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $contributorA->id,
            'entry_date' => '2026-04-10',
            'hours' => 5,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);
        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $contributorB->id,
            'entry_date' => '2026-04-12',
            'hours' => 2,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);

        $response = $this->actingAs($this->manager)
            ->get('/manager/time/reports/export?tab=projects&status=approved&date_from=2026-04-01&date_to=2026-04-30');

        $response->assertOk();

        $rows = $this->parseCsvRows($response->streamedContent());

        $this->assertSame(['Projekt', 'Hodiny', 'Počet záznamov', 'Top prispievatelia'], $rows[0]);
        $this->assertSame($this->managedProject->name, $rows[1][0]);
        $this->assertStringContainsString('Alica Test', $rows[1][3]);
        $this->assertStringContainsString('Boris Test', $rows[1][3]);
    }

    #[Test]
    public function csv_export_timeline_tab_switches_to_weekly_granularity_for_long_ranges(): void
    {
        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'entry_date' => '2026-01-15',
            'hours' => 2,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);
        TimeEntry::factory()->create([
            'project_id' => $this->managedProject->id,
            'task_id' => $this->managedTask->id,
            'user_id' => $this->member->id,
            'entry_date' => '2026-04-15',
            'hours' => 3,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);

        $response = $this->actingAs($this->manager)
            ->get('/manager/time/reports/export?tab=timeline&status=approved&date_from=2026-01-01&date_to=2026-04-30');

        $response->assertOk();

        $rows = $this->parseCsvRows($response->streamedContent());

        $this->assertSame(['Obdobie', 'Hodiny', 'Počet záznamov'], $rows[0]);
        $this->assertCount(3, $rows);
        foreach (array_slice($rows, 1) as $row) {
            $this->assertMatchesRegularExpression('/^\d{4}-\d{2}$/', $row[0]);
        }
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function parseCsvRows(string $content): array
    {
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);
        $rows = [];
        $handle = fopen('php://memory', 'r+');
        fwrite($handle, $content);
        rewind($handle);
        while (($row = fgetcsv($handle)) !== false) {
            $rows[] = $row;
        }
        fclose($handle);

        return $rows;
    }
}
