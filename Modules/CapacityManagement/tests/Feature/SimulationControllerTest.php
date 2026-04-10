<?php

namespace Modules\CapacityManagement\Tests\Feature;

use App\Enums\PermissionEnum;
use Carbon\Carbon;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\CapacityManagement\Models\EmployeeCapacity;
use Modules\Project\Models\Project;
use Modules\Project\Models\ProjectAllocation;
use Modules\Project\Models\Task;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SimulationControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $manager;
    private User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(PermissionSeeder::class);

        Carbon::setTestNow('2026-04-01 10:00:00');

        $this->manager = User::factory()->create();
        $this->manager->givePermissionTo(PermissionEnum::CAPACITY_MANAGE->value);

        $this->regularUser = User::factory()->create();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    // ── GET /capacity-management/simulation ──────────────────────────────────

    #[Test]
    public function guest_cannot_access_simulation_page(): void
    {
        $this->get('/capacity-management/simulation')
            ->assertRedirect('/login');
    }

    #[Test]
    public function regular_user_without_permission_gets_403_on_simulation_page(): void
    {
        $this->actingAs($this->regularUser)
            ->get('/capacity-management/simulation')
            ->assertForbidden();
    }

    #[Test]
    public function manager_can_access_simulation_page(): void
    {
        $this->actingAs($this->manager)
            ->get('/capacity-management/simulation')
            ->assertOk()
            ->assertInertia(fn ($page) =>
                $page->component('CapacityManagement/Simulation', false)
                    ->has('simulation')
                    ->has('simulation.baseline')
                    ->has('simulation.simulated')
                    ->has('simulation.delta')
                    ->has('simulation.suggestions')
                    ->has('can_manage')
                    ->where('can_manage', true)
            );
    }

    #[Test]
    public function simulation_page_passes_users_projects_and_allocations(): void
    {
        User::factory()->create();

        $this->actingAs($this->manager)
            ->get('/capacity-management/simulation')
            ->assertOk()
            ->assertInertia(fn ($page) =>
                $page->component('CapacityManagement/Simulation', false)
                    ->has('users')
                    ->has('projects')
                    ->has('allocations')
            );
    }

    // ── POST /capacity-management/simulation/run ──────────────────────────────

    #[Test]
    public function guest_cannot_run_simulation(): void
    {
        $this->post('/capacity-management/simulation/run', [])
            ->assertRedirect('/login');
    }

    #[Test]
    public function regular_user_without_permission_gets_403_on_run(): void
    {
        $this->actingAs($this->regularUser)
            ->post('/capacity-management/simulation/run', [])
            ->assertForbidden();
    }

    #[Test]
    public function manager_can_run_simulation_with_empty_input(): void
    {
        $this->actingAs($this->manager)
            ->post('/capacity-management/simulation/run', [])
            ->assertOk()
            ->assertInertia(fn ($page) =>
                $page->component('CapacityManagement/Simulation', false)
                    ->has('simulation.baseline')
                    ->has('simulation.simulated')
                    ->has('simulation.delta')
                    ->has('simulation.suggestions')
            );
    }

    #[Test]
    public function empty_simulation_run_returns_zero_delta(): void
    {
        User::factory()->create();

        $this->actingAs($this->manager)
            ->post('/capacity-management/simulation/run', [])
            ->assertOk()
            ->assertInertia(fn ($page) =>
                $page->component('CapacityManagement/Simulation', false)
                    ->has('simulation.delta', fn ($delta) =>
                        $delta->whereType('weekly_utilization_pp', ['integer', 'double'])
                              ->where('users_over_capacity_added', [])
                              ->where('projects_at_risk_added', [])
                              ->etc()
                    )
            );
    }

    #[Test]
    public function capacity_override_changes_simulated_weekly_capacity(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        ProjectAllocation::create([
            'user_id' => $user->id, 'project_id' => $project->id,
            'percentage' => 100, 'allocated_hours' => 160, 'used_hours' => 0,
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->endOfMonth()->toDateString(),
        ]);

        // Capacity 40→20 with 40h load → overloaded in simulated
        $this->actingAs($this->manager)
            ->post('/capacity-management/simulation/run', [
                'capacity_overrides' => [$user->id => 20],
            ])
            ->assertOk()
            ->assertInertia(fn ($page) =>
                $page->component('CapacityManagement/Simulation', false)
                    ->has('simulation.delta', fn ($delta) =>
                        $delta->has('users_over_capacity_added')
                              ->etc()
                    )
            );
    }

    #[Test]
    public function deadline_override_reflected_in_simulated_prediction(): void
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

        // Push deadline to 30 days → simulated project shows > 10 days_remaining
        $this->actingAs($this->manager)
            ->post('/capacity-management/simulation/run', [
                'deadline_overrides' => [
                    ['project_id' => $project->id, 'new_end_date' => now()->addDays(30)->toDateString()],
                ],
            ])
            ->assertOk()
            ->assertInertia(fn ($page) =>
                $page->component('CapacityManagement/Simulation', false)
                    ->has('simulation.simulated.prediction.projects')
            );
    }

    // ── Validation ────────────────────────────────────────────────────────────

    #[Test]
    public function capacity_override_rejects_value_below_1(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->manager)
            ->from('/capacity-management/simulation')
            ->post('/capacity-management/simulation/run', [
                'capacity_overrides' => [$user->id => 0],
            ]);

        $response->assertSessionHasErrors('capacity_overrides.'.$user->id);
    }

    #[Test]
    public function capacity_override_rejects_value_above_100(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->manager)
            ->from('/capacity-management/simulation')
            ->post('/capacity-management/simulation/run', [
                'capacity_overrides' => [$user->id => 101],
            ]);

        $response->assertSessionHasErrors('capacity_overrides.'.$user->id);
    }

    #[Test]
    public function deadline_override_rejects_invalid_date(): void
    {
        $project = Project::factory()->create(['owner_id' => $this->manager->id]);

        $response = $this->actingAs($this->manager)
            ->from('/capacity-management/simulation')
            ->post('/capacity-management/simulation/run', [
                'deadline_overrides' => [
                    ['project_id' => $project->id, 'new_end_date' => 'not-a-date'],
                ],
            ]);

        $response->assertSessionHasErrors('deadline_overrides.0.new_end_date');
    }

    #[Test]
    public function team_change_rejects_invalid_action(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($this->manager)
            ->from('/capacity-management/simulation')
            ->post('/capacity-management/simulation/run', [
                'team_changes' => [
                    ['project_id' => $project->id, 'user_id' => $user->id, 'action' => 'invalid'],
                ],
            ]);

        $response->assertSessionHasErrors('team_changes.0.action');
    }

    // ── Non-persistence ───────────────────────────────────────────────────────

    #[Test]
    public function run_simulation_does_not_modify_database(): void
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $user->id, 'status' => 'active',
            'end_date' => now()->addDays(10)->toDateString(),
        ]);
        EmployeeCapacity::create(['user_id' => $user->id, 'weekly_capacity_hours' => 40]);

        $this->actingAs($this->manager)
            ->post('/capacity-management/simulation/run', [
                'capacity_overrides' => [$user->id => 5],
                'deadline_overrides' => [
                    ['project_id' => $project->id, 'new_end_date' => now()->addDays(99)->toDateString()],
                ],
            ]);

        $this->assertDatabaseHas('employee_capacities', [
            'user_id' => $user->id,
            'weekly_capacity_hours' => 40,
        ]);
        $dbProject = Project::find($project->id);
        $this->assertEquals(
            now()->addDays(10)->toDateString(),
            $dbProject->end_date->toDateString()
        );
    }
}
