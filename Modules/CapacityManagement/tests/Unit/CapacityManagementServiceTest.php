<?php

namespace Modules\CapacityManagement\Tests\Unit;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\CapacityManagement\Models\EmployeeCapacity;
use Modules\CapacityManagement\Services\CapacityManagementService;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CapacityManagementServiceTest extends TestCase
{
    use RefreshDatabase;

    private CapacityManagementService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new CapacityManagementService();
        // 2026-04-01 is a Wednesday; week starts Mon 2026-03-30, ends Sun 2026-04-05
        Carbon::setTestNow('2026-04-01 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    // ── buildDashboard – basic ───────────────────────────────

    #[Test]
    public function dashboard_is_empty_when_no_users_exist(): void
    {
        $dashboard = $this->service->buildDashboard();

        $this->assertEmpty($dashboard['people']);
        $this->assertEmpty($dashboard['alerts']);
        $this->assertEmpty($dashboard['free_people']);
        $this->assertEquals(0, $dashboard['weekly_overview']['utilization']);
        $this->assertCount(12, $dashboard['history']);
    }

    #[Test]
    public function user_without_time_entries_defaults_to_40h_capacity_and_zero_load(): void
    {
        $user = User::factory()->create();

        $dashboard = $this->service->buildDashboard();
        $person = collect($dashboard['people'])->firstWhere('id', $user->id);

        $this->assertEquals(40, $person['weekly_capacity_hours']);
        $this->assertEquals(0.0, $person['weekly_load_hours']);
        $this->assertEquals(0.0, $person['weekly_utilization']);
        $this->assertEquals('green', $person['status']);
        $this->assertFalse($person['is_over_capacity']);
    }

    #[Test]
    public function user_with_custom_capacity_respects_employee_capacity_record(): void
    {
        $user = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 32]);

        $person = collect($this->service->buildDashboard()['people'])->firstWhere('id', $user->id);

        $this->assertEquals(32, $person['weekly_capacity_hours']);
    }

    // ── buildDashboard – status thresholds ──────────────────

    #[Test]
    public function utilization_below_80_percent_is_green(): void
    {
        $user = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);
        // 31h / 40h = 77.5%
        $this->createWeeklyEntry($user, 31);

        $person = collect($this->service->buildDashboard()['people'])->firstWhere('id', $user->id);

        $this->assertEquals('green', $person['status']);
        $this->assertFalse($person['is_over_capacity']);
    }

    #[Test]
    public function utilization_at_exactly_80_percent_is_orange(): void
    {
        $user = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);
        // 32h / 40h = 80%
        $this->createWeeklyEntry($user, 32);

        $person = collect($this->service->buildDashboard()['people'])->firstWhere('id', $user->id);

        $this->assertEquals('orange', $person['status']);
        $this->assertEquals(80.0, $person['weekly_utilization']);
    }

    #[Test]
    public function utilization_at_100_percent_is_orange_and_not_over_capacity(): void
    {
        $user = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);
        $this->createWeeklyEntry($user, 40);

        $person = collect($this->service->buildDashboard()['people'])->firstWhere('id', $user->id);

        $this->assertEquals('orange', $person['status']);
        $this->assertEquals(100.0, $person['weekly_utilization']);
        $this->assertFalse($person['is_over_capacity']);
    }

    #[Test]
    public function utilization_above_100_percent_is_red_and_triggers_alert(): void
    {
        $user = User::factory()->create(['name' => 'Overloaded']);
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);
        $this->createWeeklyEntry($user, 48);

        $dashboard = $this->service->buildDashboard();
        $person = collect($dashboard['people'])->firstWhere('id', $user->id);

        $this->assertEquals('red', $person['status']);
        $this->assertEquals(120.0, $person['weekly_utilization']);
        $this->assertTrue($person['is_over_capacity']);

        $this->assertCount(1, $dashboard['alerts']);
        $this->assertEquals('Overloaded', $dashboard['alerts'][0]['name']);
    }

    // ── buildDashboard – free people ────────────────────────

    #[Test]
    public function free_people_contains_only_users_below_80_percent(): void
    {
        $free = User::factory()->create(['name' => 'Free']);
        $busy = User::factory()->create(['name' => 'Busy']);
        EmployeeCapacity::create(['user_id' => $free->id, 'weekly_capacity_hours' => 40]);
        EmployeeCapacity::create(['user_id' => $busy->id, 'weekly_capacity_hours' => 40]);
        $this->createWeeklyEntry($free, 20);
        $this->createWeeklyEntry($busy, 35);

        $dashboard = $this->service->buildDashboard();
        $freeNames = collect($dashboard['free_people'])->pluck('name')->all();

        $this->assertContains('Free', $freeNames);
        $this->assertNotContains('Busy', $freeNames);
    }

    #[Test]
    public function free_people_are_sorted_by_available_hours_descending(): void
    {
        $userA = User::factory()->create(['name' => 'A']);
        $userB = User::factory()->create(['name' => 'B']);
        EmployeeCapacity::create(['user_id' => $userA->id, 'weekly_capacity_hours' => 40]);
        EmployeeCapacity::create(['user_id' => $userB->id, 'weekly_capacity_hours' => 40]);
        $this->createWeeklyEntry($userA, 30); // 10h free
        $this->createWeeklyEntry($userB, 10); // 30h free → should come first

        $freeNames = collect($this->service->buildDashboard()['free_people'])->pluck('name')->values()->all();

        $this->assertEquals(['B', 'A'], $freeNames);
    }

    // ── buildDashboard – individual history ─────────────────

    #[Test]
    public function each_person_has_12_week_history(): void
    {
        $user = User::factory()->create();

        $people = $this->service->buildDashboard()['people'];
        $person = collect($people)->firstWhere('id', $user->id);

        $this->assertArrayHasKey('history', $person);
        $this->assertCount(12, $person['history']);
    }

    #[Test]
    public function individual_history_reflects_only_that_users_entries(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $userA->id, 'weekly_capacity_hours' => 40]);
        EmployeeCapacity::create(['user_id' => $userB->id, 'weekly_capacity_hours' => 40]);

        $project = Project::factory()->create(['owner_id' => $userA->id]);
        $task = Task::factory()->create(['project_id' => $project->id]);

        // Entry for userA in current week
        TimeEntry::factory()->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $userA->id,
            'entry_date' => '2026-03-30',
            'hours' => 20,
        ]);

        $dashboard = $this->service->buildDashboard();
        $personA = collect($dashboard['people'])->firstWhere('id', $userA->id);
        $personB = collect($dashboard['people'])->firstWhere('id', $userB->id);

        // Current week (last item in history) for userA should show load
        $currentWeekA = last($personA['history']);
        $currentWeekB = last($personB['history']);

        $this->assertGreaterThan(0, $currentWeekA['load_hours']);
        $this->assertEquals(0.0, $currentWeekB['load_hours']);
    }

    // ── buildDashboard – team overview ──────────────────────

    #[Test]
    public function team_weekly_overview_sums_all_users(): void
    {
        $u1 = User::factory()->create();
        $u2 = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $u1->id, 'weekly_capacity_hours' => 40]);
        EmployeeCapacity::create(['user_id' => $u2->id, 'weekly_capacity_hours' => 40]);
        $this->createWeeklyEntry($u1, 20);
        $this->createWeeklyEntry($u2, 10);

        $overview = $this->service->buildDashboard()['weekly_overview'];

        $this->assertEquals(80, $overview['capacity_hours']);
        $this->assertEquals(30.0, $overview['load_hours']);
        $this->assertEquals(37.5, $overview['utilization']);
    }

    // ── buildDashboard – history ─────────────────────────────

    #[Test]
    public function team_history_always_returns_12_weeks(): void
    {
        $this->assertCount(12, $this->service->buildDashboard()['history']);
    }

    #[Test]
    public function history_includes_current_week_as_last_entry(): void
    {
        $history = $this->service->buildDashboard()['history'];
        $currentLabel = Carbon::now()->startOfWeek()->format('d.m') . '-' . Carbon::now()->endOfWeek()->format('d.m');

        $this->assertEquals($currentLabel, last($history)['week_label']);
    }

    #[Test]
    public function history_load_hours_reflect_entries_in_correct_week(): void
    {
        $user = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        $project = Project::factory()->create(['owner_id' => $user->id]);
        $task = Task::factory()->create(['project_id' => $project->id]);

        // Entry exactly 2 weeks ago
        $twoWeeksAgo = Carbon::now()->startOfWeek()->subWeeks(2);
        TimeEntry::factory()->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $user->id,
            'entry_date' => $twoWeeksAgo->toDateString(),
            'hours' => 25,
        ]);

        $history = $this->service->buildDashboard()['history'];
        // Index 9 = 2 weeks ago (11 - 2 = 9)
        $targetWeek = $history[9];

        $this->assertEquals(25.0, $targetWeek['load_hours']);
        $this->assertGreaterThan(0, $targetWeek['utilization']);
    }

    // ── buildPrediction ──────────────────────────────────────

    #[Test]
    public function prediction_with_no_active_projects_shows_zero_remaining(): void
    {
        $prediction = $this->service->buildDashboard()['prediction'];

        $this->assertEquals(0.0, $prediction['remaining_project_hours']);
        $this->assertTrue($prediction['can_finish']);
        $this->assertEmpty($prediction['projects']);
    }

    #[Test]
    public function prediction_calculates_remaining_hours_from_active_project_tasks(): void
    {
        $user = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        $project = Project::factory()->create(['owner_id' => $user->id, 'status' => 'active']);
        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'in_progress',
            'estimated_hours' => 100,
            'actual_hours' => 20,
        ]);
        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'in_progress',
            'estimated_hours' => 50,
            'actual_hours' => 50,
        ]); // no remaining

        $prediction = $this->service->buildDashboard()['prediction'];

        // Only the first task contributes: 100 - 20 = 80h
        $this->assertEquals(80.0, $prediction['remaining_project_hours']);
    }

    #[Test]
    public function prediction_excludes_completed_tasks(): void
    {
        $user = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        $project = Project::factory()->create(['owner_id' => $user->id, 'status' => 'active']);
        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'done',
            'estimated_hours' => 100,
            'actual_hours' => 10,
        ]);

        $prediction = $this->service->buildDashboard()['prediction'];

        $this->assertEquals(0.0, $prediction['remaining_project_hours']);
    }

    #[Test]
    public function prediction_excludes_inactive_projects(): void
    {
        $user = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        $project = Project::factory()->create(['owner_id' => $user->id, 'status' => 'completed']);
        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'estimated_hours' => 80,
            'actual_hours' => 0,
        ]);

        $prediction = $this->service->buildDashboard()['prediction'];

        $this->assertEmpty($prediction['projects']);
        $this->assertEquals(0.0, $prediction['remaining_project_hours']);
    }

    #[Test]
    public function prediction_confidence_is_100_when_team_has_ample_capacity(): void
    {
        $user = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        $project = Project::factory()->create(['owner_id' => $user->id, 'status' => 'active']);
        // 10h remaining, 40 * 4 = 160h available → confidence 100%
        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'estimated_hours' => 10,
            'actual_hours' => 0,
        ]);

        $prediction = $this->service->buildDashboard()['prediction'];

        $this->assertTrue($prediction['can_finish']);
        $this->assertEquals(100.0, $prediction['confidence']);
    }

    #[Test]
    public function prediction_can_finish_is_false_when_remaining_exceeds_available(): void
    {
        $user = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        // 40 * 4 = 160h available, need 200h
        $project = Project::factory()->create(['owner_id' => $user->id, 'status' => 'active']);
        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'estimated_hours' => 200,
            'actual_hours' => 0,
        ]);

        $prediction = $this->service->buildDashboard()['prediction'];

        $this->assertFalse($prediction['can_finish']);
        $this->assertLessThan(100, $prediction['confidence']);
    }

    #[Test]
    public function prediction_per_project_includes_days_remaining_and_overdue_flag(): void
    {
        $user = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        $futureProject = Project::factory()->create([
            'owner_id' => $user->id,
            'status' => 'active',
            'end_date' => Carbon::now()->addDays(10),
        ]);
        Task::factory()->create(['project_id' => $futureProject->id, 'status' => 'todo', 'estimated_hours' => 5, 'actual_hours' => 0]);

        $overdueProject = Project::factory()->create([
            'owner_id' => $user->id,
            'status' => 'active',
            'end_date' => Carbon::now()->subDays(3),
        ]);
        Task::factory()->create(['project_id' => $overdueProject->id, 'status' => 'todo', 'estimated_hours' => 5, 'actual_hours' => 0]);

        $projects = $this->service->buildDashboard()['prediction']['projects'];
        $future = collect($projects)->firstWhere('id', $futureProject->id);
        $overdue = collect($projects)->firstWhere('id', $overdueProject->id);

        $this->assertFalse($future['is_overdue']);
        $this->assertGreaterThan(0, $future['days_remaining']);

        $this->assertTrue($overdue['is_overdue']);
        $this->assertEquals(0, $overdue['days_remaining']);
    }

    // ── setWeeklyCapacityForUser ──────────────────────────────

    #[Test]
    public function it_creates_capacity_record_when_none_exists(): void
    {
        $user = User::factory()->create();

        $this->service->setWeeklyCapacityForUser($user->id, 35);

        $this->assertDatabaseHas('employee_capacities', [
            'user_id' => $user->id,
            'weekly_capacity_hours' => 35,
        ]);
    }

    #[Test]
    public function it_updates_existing_capacity_record(): void
    {
        $user = User::factory()->create();
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        $this->service->setWeeklyCapacityForUser($user->id, 45);

        $this->assertDatabaseHas('employee_capacities', ['user_id' => $user->id, 'weekly_capacity_hours' => 45]);
        $this->assertDatabaseCount('employee_capacities', 1);
    }

    // ── Helpers ──────────────────────────────────────────────

    private function createWeeklyEntry(User $user, float $hours): void
    {
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $task = Task::factory()->create(['project_id' => $project->id]);
        TimeEntry::factory()->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $user->id,
            'entry_date' => '2026-03-31', // Monday of the test week
            'hours' => $hours,
        ]);
    }
}
