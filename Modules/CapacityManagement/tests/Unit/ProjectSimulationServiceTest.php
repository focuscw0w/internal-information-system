<?php

namespace Modules\CapacityManagement\Tests\Unit;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\CapacityManagement\DTO\ProjectSimulationInput;
use Modules\CapacityManagement\Models\EmployeeCapacity;
use Modules\CapacityManagement\Services\ProjectSimulationService;
use Modules\Project\Models\Project;
use Modules\Project\Models\ProjectAllocation;
use Modules\Project\Models\Task;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProjectSimulationServiceTest extends TestCase
{
    use RefreshDatabase;

    private ProjectSimulationService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(ProjectSimulationService::class);
        Carbon::setTestNow('2026-04-01 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    #[Test]
    public function baseline_simulation_uses_project_tasks_allocations_and_capacities(): void
    {
        $project = Project::factory()->create([
            'name' => 'Migration',
            'end_date' => '2026-04-29',
        ]);

        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'in_progress',
            'estimated_hours' => 100,
            'actual_hours' => 40,
        ]);
        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'estimated_hours' => 20,
            'actual_hours' => 0,
        ]);

        $userA = User::factory()->create();
        $userB = User::factory()->create();

        EmployeeCapacity::create(['user_id' => $userA->id, 'weekly_capacity_hours' => 40]);
        EmployeeCapacity::create(['user_id' => $userB->id, 'weekly_capacity_hours' => 20]);

        $this->createAllocation($project, $userA, [
            'allocated_hours' => 80,
            'percentage' => 0,
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-28',
        ]);
        $this->createAllocation($project, $userB, [
            'allocated_hours' => 0,
            'percentage' => 50,
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-30',
        ]);

        $result = $this->service->simulate($project, new ProjectSimulationInput);

        $this->assertSame($project->id, $result->projectId);
        $this->assertSame('2026-04-29', $result->baselineDeadline);
        $this->assertSame(80.0, $result->baselineRemainingHours);
        $this->assertSame(30.0, $result->baselineWeeklyCapacity);
        $this->assertSame(2, $result->baselineTeamSize);
        $this->assertSame('2026-04-22', $result->forecastFinishDate);
        $this->assertTrue($result->willMeetDeadline);
        $this->assertSame(80.0, $result->burnDownPoints[0]['ideal_remaining']);
        $this->assertSame(80.0, $result->burnDownPoints[0]['forecast_remaining']);
        $this->assertSame(1, collect($result->burnDownPoints)->where('is_deadline_week', true)->count());
    }

    #[Test]
    public function simulation_overrides_scale_team_capacity_and_remaining_hours(): void
    {
        $project = Project::factory()->create([
            'end_date' => '2026-04-29',
        ]);

        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'estimated_hours' => 120,
            'actual_hours' => 0,
        ]);

        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $this->createAllocation($project, $userA, [
            'allocated_hours' => 80,
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-28',
        ]);
        $this->createAllocation($project, $userB, [
            'allocated_hours' => 40,
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-28',
        ]);

        $result = $this->service->simulate($project, new ProjectSimulationInput(
            deadlineDaysShift: 7,
            teamSize: 3,
            remainingHours: 60,
        ));

        $this->assertSame('2026-05-06', $result->simulatedDeadline);
        $this->assertSame(120.0, $result->baselineRemainingHours);
        $this->assertSame(60.0, $result->simulatedRemainingHours);
        $this->assertSame(2, $result->baselineTeamSize);
        $this->assertSame(3, $result->simulatedTeamSize);
        $this->assertSame(30.0, $result->baselineWeeklyCapacity);
        $this->assertSame(45.0, $result->simulatedWeeklyCapacity);
        $this->assertSame('2026-04-15', $result->forecastFinishDate);
        $this->assertTrue($result->willMeetDeadline);
    }

    #[Test]
    public function project_without_deadline_and_without_capacity_uses_fallback_deadline_and_never_finishes(): void
    {
        $project = Project::factory()->create();
        $project->end_date = null;

        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'estimated_hours' => 20,
            'actual_hours' => 0,
        ]);

        $result = $this->service->simulate($project, new ProjectSimulationInput);

        $this->assertSame('2026-07-01', $result->baselineDeadline);
        $this->assertSame('2026-07-01', $result->simulatedDeadline);
        $this->assertSame(0, $result->baselineTeamSize);
        $this->assertSame(0.0, $result->baselineWeeklyCapacity);
        $this->assertNull($result->forecastFinishDate);
        $this->assertNull($result->finishDiffDays);
        $this->assertFalse($result->willMeetDeadline);
    }

    #[Test]
    public function zero_baseline_team_size_uses_fallback_capacity_when_team_size_is_simulated(): void
    {
        $project = Project::factory()->create([
            'end_date' => '2026-04-20',
        ]);

        Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'estimated_hours' => 50,
            'actual_hours' => 0,
        ]);

        $result = $this->service->simulate($project, new ProjectSimulationInput(
            teamSize: 3,
        ));

        $this->assertSame(0, $result->baselineTeamSize);
        $this->assertSame(0.0, $result->baselineWeeklyCapacity);
        $this->assertSame(60.0, $result->simulatedWeeklyCapacity);
        $this->assertSame('2026-04-08', $result->forecastFinishDate);
    }

    private function createAllocation(Project $project, User $user, array $overrides = []): void
    {
        ProjectAllocation::query()->create(array_merge([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'allocated_hours' => 40,
            'used_hours' => 0,
            'percentage' => 0,
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-28',
            'notes' => null,
        ], $overrides));
    }
}
