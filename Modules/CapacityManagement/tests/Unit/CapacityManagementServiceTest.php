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
        Carbon::setTestNow('2026-04-01 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    #[Test]
    public function it_builds_dashboard_with_utilization_alerts_and_free_people(): void
    {
        $userOver = User::factory()->create(['name' => 'Overloaded User']);
        $userFree = User::factory()->create(['name' => 'Free User']);

        EmployeeCapacity::create([
            'user_id' => $userOver->id,
            'weekly_capacity_hours' => 40,
        ]);

        EmployeeCapacity::create([
            'user_id' => $userFree->id,
            'weekly_capacity_hours' => 40,
        ]);

        $project = Project::factory()->create([
            'owner_id' => $userOver->id,
            'status' => 'active',
        ]);

        $task = Task::factory()->create([
            'project_id' => $project->id,
            'estimated_hours' => 100,
            'actual_hours' => 10,
        ]);

        // Current week entries -> overloaded user above 100%, free user below 80%
        TimeEntry::factory()->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $userOver->id,
            'entry_date' => '2026-03-31',
            'hours' => 48,
        ]);

        TimeEntry::factory()->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $userFree->id,
            'entry_date' => '2026-03-30',
            'hours' => 20,
        ]);

        $dashboard = $this->service->buildDashboard();

        $this->assertNotEmpty($dashboard['people']);
        $this->assertCount(1, $dashboard['alerts']);
        $this->assertEquals('Overloaded User', $dashboard['alerts'][0]['name']);

        $freeNames = collect($dashboard['free_people'])->pluck('name')->values()->all();
        $this->assertContains('Free User', $freeNames);

        $overloaded = collect($dashboard['people'])->firstWhere('name', 'Overloaded User');
        $this->assertEquals(120.0, $overloaded['weekly_utilization']);
        $this->assertEquals('red', $overloaded['status']);

        $this->assertArrayHasKey('prediction', $dashboard);
        $this->assertArrayHasKey('history', $dashboard);
        $this->assertCount(12, $dashboard['history']);
    }

    #[Test]
    public function it_creates_or_updates_weekly_capacity(): void
    {
        $user = User::factory()->create();

        $this->service->setWeeklyCapacityForUser($user->id, 35);

        $this->assertDatabaseHas('employee_capacities', [
            'user_id' => $user->id,
            'weekly_capacity_hours' => 35,
        ]);

        $this->service->setWeeklyCapacityForUser($user->id, 45);

        $this->assertDatabaseHas('employee_capacities', [
            'user_id' => $user->id,
            'weekly_capacity_hours' => 45,
        ]);
    }
}
