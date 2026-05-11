<?php

namespace Modules\CapacityManagement\Tests\Feature;

use App\Enums\PermissionEnum;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\CapacityManagement\Models\EmployeeCapacity;
use Modules\Project\Models\Project;
use Modules\Project\Models\ProjectAllocation;
use Modules\Project\Models\Task;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProjectSimulationControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $manager;
    private User $regularUser;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(PermissionSeeder::class);

        $this->manager = User::factory()->create();
        $this->manager->givePermissionTo(PermissionEnum::CAPACITY_MANAGE->value);

        $this->regularUser = User::factory()->create();
        $this->project = Project::factory()->create([
            'name' => 'ERP rollout',
            'end_date' => now()->addWeeks(4),
        ]);

        $this->prepareProjectData($this->project);
    }

    #[Test]
    public function guest_cannot_view_project_simulation(): void
    {
        $this->get("/capacity-management/simulation/project/{$this->project->id}")
            ->assertRedirect('/login');
    }

    #[Test]
    public function regular_user_cannot_view_project_simulation(): void
    {
        $this->actingAs($this->regularUser)
            ->get("/capacity-management/simulation/project/{$this->project->id}")
            ->assertForbidden();
    }

    #[Test]
    public function manager_can_view_project_simulation_page(): void
    {
        $response = $this->actingAs($this->manager)
            ->get("/capacity-management/simulation/project/{$this->project->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('CapacityManagement/ProjectSimulation', false)
                ->where('project.id', $this->project->id)
                ->where('project.name', 'ERP rollout')
                ->where('can_manage', true)
                ->where('simulation.project_id', $this->project->id)
                ->has('simulation.burn_down_points')
        );
    }

    #[Test]
    public function guest_cannot_run_project_simulation(): void
    {
        $this->post("/capacity-management/simulation/project/{$this->project->id}/run", [
            'team_size' => 3,
        ])->assertRedirect('/login');
    }

    #[Test]
    public function regular_user_cannot_run_project_simulation(): void
    {
        $this->actingAs($this->regularUser)
            ->post("/capacity-management/simulation/project/{$this->project->id}/run", [
                'team_size' => 3,
            ])->assertForbidden();
    }

    #[Test]
    public function manager_can_run_project_simulation_with_overrides_without_persisting_changes(): void
    {
        $allocationCount = ProjectAllocation::query()->count();
        $capacityCount = EmployeeCapacity::query()->count();

        $response = $this->actingAs($this->manager)
            ->post("/capacity-management/simulation/project/{$this->project->id}/run", [
                'deadline_days_shift' => 14,
                'team_size' => 3,
                'remaining_hours' => 60,
            ]);

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('CapacityManagement/ProjectSimulation', false)
                ->where('simulation.project_id', $this->project->id)
                ->where('simulation.simulated_team_size', 3)
                ->where('simulation.simulated_remaining_hours', 60)
                ->has('simulation.burn_down_points')
        );

        $this->assertSame($allocationCount, ProjectAllocation::query()->count());
        $this->assertSame($capacityCount, EmployeeCapacity::query()->count());
    }

    #[Test]
    public function manager_can_run_project_simulation_as_json_for_dashboard_card(): void
    {
        $response = $this->actingAs($this->manager)
            ->postJson("/capacity-management/simulation/project/{$this->project->id}/run", [
                'deadline_days_shift' => 7,
                'team_size' => 2,
                'remaining_hours' => 50,
            ]);

        $response->assertOk()
            ->assertJsonPath('simulation.project_id', $this->project->id)
            ->assertJsonPath('simulation.simulated_team_size', 2)
            ->assertJsonPath('simulation.simulated_remaining_hours', 50)
            ->assertJsonStructure([
                'simulation' => [
                    'burn_down_points',
                    'forecast_finish_date',
                    'will_meet_deadline',
                ],
            ]);
    }

    #[Test]
    public function run_simulation_validates_payload(): void
    {
        $response = $this->actingAs($this->manager)
            ->from("/capacity-management/simulation/project/{$this->project->id}")
            ->post("/capacity-management/simulation/project/{$this->project->id}/run", [
                'deadline_days_shift' => 366,
                'team_size' => 51,
                'remaining_hours' => -1,
            ]);

        $response->assertRedirect("/capacity-management/simulation/project/{$this->project->id}");
        $response->assertSessionHasErrors([
            'deadline_days_shift',
            'team_size',
            'remaining_hours',
        ]);
    }

    private function prepareProjectData(Project $project): void
    {
        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'estimated_hours' => 80,
            'actual_hours' => 20,
        ]);

        $user = User::factory()->create();
        EmployeeCapacity::create([
            'user_id' => $user->id,
            'weekly_capacity_hours' => 40,
        ]);

        ProjectAllocation::query()->create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'allocated_hours' => 80,
            'used_hours' => 0,
            'percentage' => 0,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addWeeks(4)->toDateString(),
            'notes' => null,
        ]);
    }
}
