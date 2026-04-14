<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\CapacityManagement\Models\EmployeeCapacity;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\Project\Notifications\ProjectCapacityAtRiskNotification;
use Modules\Project\Notifications\ProjectOverdueNotification;
use Modules\Project\Notifications\TaskHoursExceededNotification;
use Modules\Project\Notifications\UserOverloadedNotification;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class RealisticOperationsSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-04-14 09:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    #[Test]
    public function database_seeder_creates_realistic_cross_module_demo_data(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('projects', 3);
        $this->assertDatabaseCount('employee_capacities', 7);
        $this->assertGreaterThanOrEqual(14, Task::count());
        $this->assertGreaterThanOrEqual(60, TimeEntry::count());

        $erp = Project::where('name', 'ERP migrácia 2026')->firstOrFail();
        $mobile = Project::where('name', 'Mobilný sklad')->firstOrFail();
        $reporting = Project::where('name', 'Interný reporting')->firstOrFail();

        $this->assertSame('active', $erp->status);
        $this->assertSame('active', $mobile->status);
        $this->assertSame('active', $reporting->status);
        $this->assertTrue($mobile->is_overdue);

        $simon = User::where('email', 'simon.kubik@test.com')->firstOrFail();
        $simonCapacity = EmployeeCapacity::where('user_id', $simon->id)->firstOrFail();
        $simonWeeklyHours = (float) TimeEntry::query()
            ->where('user_id', $simon->id)
            ->whereBetween('entry_date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])
            ->sum('hours');

        $this->assertSame(16, $simonCapacity->weekly_capacity_hours);
        $this->assertGreaterThan(16, $simonWeeklyHours);

        $releaseTask = Task::where('title', 'Stabilizovať release candidate')->firstOrFail();
        $this->assertGreaterThan((float) $releaseTask->estimated_hours, (float) $releaseTask->actual_hours);

        $this->assertDatabaseHas('notifications', ['type' => UserOverloadedNotification::class]);
        $this->assertDatabaseHas('notifications', ['type' => ProjectCapacityAtRiskNotification::class]);
        $this->assertDatabaseHas('notifications', ['type' => ProjectOverdueNotification::class]);
        $this->assertDatabaseHas('notifications', ['type' => TaskHoursExceededNotification::class]);
    }
}
