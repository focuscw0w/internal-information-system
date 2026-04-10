<?php

namespace Modules\CapacityManagement\Tests\Unit;

use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\CapacityManagement\Contracts\SimulationServiceInterface;
use Modules\CapacityManagement\Services\CapacityManagementService;
use Modules\CapacityManagement\DTO\SimulationAllocationOverride;
use Modules\CapacityManagement\DTO\SimulationDeadlineOverride;
use Modules\CapacityManagement\DTO\SimulationInput;
use Modules\CapacityManagement\DTO\SimulationTeamChange;
use Modules\CapacityManagement\Enums\SimulationTeamAction;
use Modules\CapacityManagement\Models\EmployeeCapacity;
use Modules\Project\Models\Project;
use Modules\Project\Models\ProjectAllocation;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SimulationServiceTest extends TestCase
{
    use RefreshDatabase;

    private SimulationServiceInterface $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(SimulationServiceInterface::class);
        Carbon::setTestNow('2026-04-01 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function createAllocation(array $attrs): ProjectAllocation
    {
        return ProjectAllocation::create(array_merge([
            'allocated_hours' => 160,
            'used_hours' => 0,
            'percentage' => 100,
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->endOfMonth()->toDateString(),
        ], $attrs));
    }

    // ── Empty simulation (no overrides) ──────────────────────────────────────

    #[Test]
    public function empty_simulation_baseline_and_simulated_are_equal(): void
    {
        User::factory()->create();

        $result = $this->service->simulate(new SimulationInput);

        $this->assertEquals($result->baseline['weekly_overview'], $result->simulated['weekly_overview']);
        $this->assertEquals($result->baseline['prediction'], $result->simulated['prediction']);
        $this->assertEmpty($result->delta['users_over_capacity_added']);
        $this->assertEmpty($result->delta['projects_at_risk_added']);
    }

    // ── Capacity override ─────────────────────────────────────────────────────

    #[Test]
    public function capacity_override_changes_utilization_in_simulated_state(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        // 100% allocation → 40h/week load
        $this->createAllocation(['user_id' => $user->id, 'project_id' => $project->id, 'percentage' => 100]);

        // Reduce capacity to 20h → same 40h load → 200% (overloaded)
        $result = $this->service->simulate(new SimulationInput(
            capacityOverrides: [$user->id => 20],
        ));

        $baselinePerson  = collect($result->baseline['people'])->firstWhere('id', $user->id);
        $simulatedPerson = collect($result->simulated['people'])->firstWhere('id', $user->id);

        $this->assertEquals(40, $baselinePerson['weekly_capacity_hours']);
        $this->assertEquals(20, $simulatedPerson['weekly_capacity_hours']);
        $this->assertGreaterThan($baselinePerson['weekly_utilization'], $simulatedPerson['weekly_utilization']);
        $this->assertTrue($simulatedPerson['is_over_capacity']);
    }

    #[Test]
    public function increasing_capacity_reduces_utilization_in_simulated_state(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        $this->createAllocation(['user_id' => $user->id, 'project_id' => $project->id, 'percentage' => 100]);

        $result = $this->service->simulate(new SimulationInput(
            capacityOverrides: [$user->id => 80],
        ));

        $simulatedPerson = collect($result->simulated['people'])->firstWhere('id', $user->id);

        $this->assertEquals(80, $simulatedPerson['weekly_capacity_hours']);
        $this->assertEquals(32.0, $simulatedPerson['weekly_load_hours']);
        $this->assertEquals(40.0, $simulatedPerson['weekly_utilization']);
    }

    #[Test]
    public function simulation_baseline_matches_dashboard_baseline_even_when_allocations_differ_from_time_entries(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $user->id,
            'status' => 'active',
            'end_date' => now()->addDays(15)->toDateString(),
        ]);
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);
        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'estimated_hours' => 20,
            'actual_hours' => 0,
        ]);

        $this->createAllocation([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'allocated_hours' => 160,
            'percentage' => 100,
        ]);

        TimeEntry::factory()->create([
            'project_id' => $project->id,
            'task_id' => Task::factory()->create(['project_id' => $project->id])->id,
            'user_id' => $user->id,
            'entry_date' => now()->toDateString(),
            'hours' => 5,
        ]);

        $dashboard = app(CapacityManagementService::class)->buildDashboard();
        $simulation = $this->service->simulate(new SimulationInput);

        $this->assertEquals($dashboard['weekly_overview'], $simulation->baseline['weekly_overview']);
        $this->assertEquals($dashboard['monthly_overview'], $simulation->baseline['monthly_overview']);
        $this->assertEquals($dashboard['prediction'], $simulation->baseline['prediction']);
    }

    // ── Allocation override ───────────────────────────────────────────────────

    #[Test]
    public function reducing_allocation_percentage_reduces_simulated_load(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        $allocation = $this->createAllocation([
            'user_id' => $user->id, 'project_id' => $project->id, 'percentage' => 100,
        ]);

        $result = $this->service->simulate(new SimulationInput(
            allocationOverrides: [
                new SimulationAllocationOverride(
                    projectId: $project->id, userId: $user->id,
                    allocationId: $allocation->id, percentage: 50,
                ),
            ],
        ));

        $simulatedPerson = collect($result->simulated['people'])->firstWhere('id', $user->id);

        $this->assertEquals(16.0, $simulatedPerson['weekly_load_hours']);
        $this->assertEquals(40.0, $simulatedPerson['weekly_utilization']);
    }

    #[Test]
    public function deleting_allocation_removes_load_in_simulated_state(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        $allocation = $this->createAllocation([
            'user_id' => $user->id, 'project_id' => $project->id, 'percentage' => 100,
        ]);

        $result = $this->service->simulate(new SimulationInput(
            allocationOverrides: [
                new SimulationAllocationOverride(
                    projectId: $project->id, userId: $user->id,
                    allocationId: $allocation->id, delete: true,
                ),
            ],
        ));

        $simulatedPerson = collect($result->simulated['people'])->firstWhere('id', $user->id);

        $this->assertEquals(0.0, $simulatedPerson['weekly_load_hours']);
        $this->assertEquals(0.0, $simulatedPerson['weekly_utilization']);
    }

    #[Test]
    public function adding_new_allocation_increases_simulated_load(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        // No existing allocation → baseline load = 0
        $result = $this->service->simulate(new SimulationInput(
            allocationOverrides: [
                new SimulationAllocationOverride(
                    projectId: $project->id, userId: $user->id,
                    allocationId: null, allocatedHours: 80, percentage: 50,
                    startDate: CarbonImmutable::parse(now()->startOfMonth()),
                    endDate: CarbonImmutable::parse(now()->endOfMonth()),
                ),
            ],
        ));

        $baselineLoad  = collect($result->baseline['people'])->firstWhere('id', $user->id)['weekly_load_hours'];
        $simulatedLoad = collect($result->simulated['people'])->firstWhere('id', $user->id)['weekly_load_hours'];

        $this->assertEquals(0.0, $baselineLoad);
        $this->assertGreaterThan(0.0, $simulatedLoad);
    }

    // ── Deadline override ─────────────────────────────────────────────────────

    #[Test]
    public function extending_deadline_increases_days_remaining_in_prediction(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $user->id, 'status' => 'active',
            'end_date' => now()->addDays(10)->toDateString(),
        ]);
        Task::factory()->create([
            'project_id' => $project->id, 'status' => 'todo',
            'estimated_hours' => 10, 'actual_hours' => 0,
        ]);

        $result = $this->service->simulate(new SimulationInput(
            deadlineOverrides: [
                new SimulationDeadlineOverride($project->id, CarbonImmutable::parse(now()->addDays(30))),
            ],
        ));

        $baselineProject  = collect($result->baseline['prediction']['projects'])->firstWhere('id', $project->id);
        $simulatedProject = collect($result->simulated['prediction']['projects'])->firstWhere('id', $project->id);

        $this->assertGreaterThan($baselineProject['days_remaining'], $simulatedProject['days_remaining']);
    }

    #[Test]
    public function moving_deadline_to_past_makes_project_overdue_in_simulated_state(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $user->id, 'status' => 'active',
            'end_date' => now()->addDays(10)->toDateString(),
        ]);
        Task::factory()->create([
            'project_id' => $project->id, 'status' => 'todo',
            'estimated_hours' => 5, 'actual_hours' => 0,
        ]);

        $result = $this->service->simulate(new SimulationInput(
            deadlineOverrides: [
                new SimulationDeadlineOverride($project->id, CarbonImmutable::parse(now()->subDays(5))),
            ],
        ));

        $baselineProject  = collect($result->baseline['prediction']['projects'])->firstWhere('id', $project->id);
        $simulatedProject = collect($result->simulated['prediction']['projects'])->firstWhere('id', $project->id);

        $this->assertFalse($baselineProject['is_overdue']);
        $this->assertTrue($simulatedProject['is_overdue']);
    }

    // ── Team change ───────────────────────────────────────────────────────────

    #[Test]
    public function removing_team_member_drops_their_allocation_in_simulated_state(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        $this->createAllocation([
            'user_id' => $user->id, 'project_id' => $project->id, 'percentage' => 100,
        ]);

        $result = $this->service->simulate(new SimulationInput(
            teamChanges: [
                new SimulationTeamChange($project->id, $user->id, SimulationTeamAction::REMOVE),
            ],
        ));

        $simulatedPerson = collect($result->simulated['people'])->firstWhere('id', $user->id);

        $this->assertEquals(0.0, $simulatedPerson['weekly_load_hours']);
    }

    // ── Non-persistence guarantee ─────────────────────────────────────────────

    #[Test]
    public function simulation_does_not_persist_any_changes_to_the_database(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $user->id, 'status' => 'active',
            'end_date' => now()->addDays(10)->toDateString(),
        ]);
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);
        Task::factory()->create([
            'project_id' => $project->id, 'status' => 'todo',
            'estimated_hours' => 20, 'actual_hours' => 0,
        ]);

        $this->service->simulate(new SimulationInput(
            capacityOverrides: [$user->id => 10],
            deadlineOverrides: [
                new SimulationDeadlineOverride($project->id, CarbonImmutable::parse(now()->addDays(99))),
            ],
        ));

        // DB state must be unchanged
        $this->assertDatabaseHas('employee_capacities', [
            'user_id' => $user->id,
            'weekly_capacity_hours' => 40,
        ]);
        // Project end_date should still be original value (using Carbon for comparison)
        $dbProject = Project::find($project->id);
        $this->assertEquals(
            now()->addDays(10)->toDateString(),
            $dbProject->end_date->toDateString()
        );
    }

    // ── Delta ─────────────────────────────────────────────────────────────────

    #[Test]
    public function delta_contains_per_user_and_per_project_entries(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $user->id, 'status' => 'active',
            'end_date' => now()->addDays(20)->toDateString(),
        ]);
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);
        Task::factory()->create([
            'project_id' => $project->id, 'status' => 'todo',
            'estimated_hours' => 50, 'actual_hours' => 0,
        ]);

        $result = $this->service->simulate(new SimulationInput(
            capacityOverrides: [$user->id => 30],
        ));

        $this->assertArrayHasKey('per_user', $result->delta);
        $this->assertArrayHasKey('per_project', $result->delta);
        $this->assertNotEmpty($result->delta['per_user']);
    }

    #[Test]
    public function new_overload_appears_in_delta_users_over_capacity_added(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        // 100% allocation → 40h/week
        $this->createAllocation([
            'user_id' => $user->id, 'project_id' => $project->id, 'percentage' => 100,
        ]);

        // Reduce capacity from 40 to 30 → 133% → overloaded
        $result = $this->service->simulate(new SimulationInput(
            capacityOverrides: [$user->id => 30],
        ));

        $addedIds = array_column($result->delta['users_over_capacity_added'], 'id');
        $this->assertContains($user->id, $addedIds);
    }
}
