<?php

namespace Modules\CapacityManagement\Tests\Unit;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\CapacityManagement\Contracts\Repositories\CapacityAccessRepositoryInterface;
use Modules\CapacityManagement\Contracts\Repositories\CapacityDashboardRepositoryInterface;
use Modules\CapacityManagement\Contracts\Repositories\CapacityForecastRepositoryInterface;
use Modules\CapacityManagement\Contracts\Repositories\CapacityNotificationRepositoryInterface;
use Modules\CapacityManagement\Contracts\Repositories\EmployeeCapacityRepositoryInterface;
use Modules\CapacityManagement\Contracts\Repositories\ManagerDashboardRepositoryInterface;
use Modules\CapacityManagement\Models\EmployeeCapacity;
use Modules\Project\Models\Project;
use Modules\Project\Models\ProjectAllocation;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Enums\TimeEntryStatusEnum;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CapacityRepositoriesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-04-08 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    #[Test]
    public function employee_capacity_repository_reads_writes_and_maps_weekly_capacities(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $repository = app(EmployeeCapacityRepositoryInterface::class);

        $this->assertNull($repository->weeklyCapacityForUser($user->id));

        $repository->updateOrCreateWeeklyCapacity($user->id, 32);
        EmployeeCapacity::query()->create(['user_id' => $other->id, 'weekly_capacity_hours' => 24]);

        $this->assertSame(32, $repository->weeklyCapacityForUser($user->id));
        $this->assertSame([$user->id => 32], $repository->weeklyCapacitiesForUsers([$user->id]));
        $this->assertSame(24, (int) $repository->weeklyCapacityMap()[$other->id]);

        $repository->updateOrCreateWeeklyCapacity($user->id, 36);

        $this->assertSame(36, $repository->weeklyCapacityForUser($user->id));
    }

    #[Test]
    public function forecast_repository_returns_allocations_for_active_capacity_scenarios(): void
    {
        $project = Project::factory()->create();
        $otherProject = Project::factory()->create();
        $user = User::factory()->create();
        $repository = app(CapacityForecastRepositoryInterface::class);

        $allocation = $this->createAllocation($project, $user);
        $otherAllocation = $this->createAllocation($otherProject, $user);

        $this->assertTrue($repository->allocationsForProjects([$project->id])->contains('id', $allocation->id));
        $this->assertFalse($repository->allocationsForProjects([$project->id])->contains('id', $otherAllocation->id));
        $this->assertTrue($repository->allocationsForProject($project->id)->contains('id', $allocation->id));
    }

    #[Test]
    public function access_repository_allows_admins_owners_and_time_managers(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $owner = User::factory()->create();
        $timeManager = User::factory()->create();
        $regular = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->team()->attach($timeManager->id, [
            'permissions' => json_encode(['manage_time_entries']),
            'allocation' => 50,
        ]);

        $repository = app(CapacityAccessRepositoryInterface::class);

        $this->assertTrue($repository->canAccessManagerArea($admin));
        $this->assertTrue($repository->canAccessManagerArea($owner));
        $this->assertTrue($repository->hasTimeEntryManagementProjects($timeManager));
        $this->assertTrue($repository->canAccessManagerArea($timeManager));
        $this->assertFalse($repository->canAccessManagerArea($regular));
    }

    #[Test]
    public function dashboard_repository_returns_personal_tasks_projects_and_time_stats(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $user->id,
            'end_date' => '2026-04-20',
        ]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'due_date' => '2026-04-08',
        ]);
        $task->assignedUsers()->attach($user->id);

        TimeEntry::factory()->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $user->id,
            'entry_date' => '2026-04-06',
            'hours' => 4,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);
        TimeEntry::factory()->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $user->id,
            'entry_date' => '2026-04-08',
            'hours' => 2,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $repository = app(CapacityDashboardRepositoryInterface::class);
        $stats = $repository->weekTimeEntryStatsForUser($user->id, '2026-04-06', '2026-04-08');

        $this->assertTrue($repository->tasksDueForUser($user, '2026-04-08')->contains('id', $task->id));
        $this->assertTrue($repository->atRiskProjectsForUser($user)->contains('id', $project->id));
        $this->assertSame(6.0, $stats['logged_hours']);
        $this->assertSame(2.0, $stats['today_hours']);
        $this->assertSame(2, $stats['entries_count']);
    }

    #[Test]
    public function manager_repository_returns_approval_project_and_hour_queries(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $owner->id,
            'end_date' => '2026-04-30',
        ]);
        $project->team()->attach($member->id, [
            'permissions' => json_encode(['manage_team']),
            'allocation' => 75,
        ]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'due_date' => '2026-04-07',
        ]);
        TimeEntry::factory()->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $member->id,
            'entry_date' => '2026-04-08',
            'hours' => 5,
            'status' => TimeEntryStatusEnum::Pending->value,
        ]);

        $repository = app(ManagerDashboardRepositoryInterface::class);
        $projectHours = $repository->projectHoursByProjectAndUser([$project->id], Carbon::parse('2026-04-06'), Carbon::parse('2026-04-12'));

        $this->assertSame(1, $repository->pendingApprovalCount([$project->id]));
        $this->assertTrue($repository->pendingApprovalEntries([$project->id])->contains('project_id', $project->id));
        $this->assertTrue($repository->overdueTasks([$project->id])->contains('id', $task->id));
        $this->assertTrue($repository->managedProjectIds($owner, false)->contains($project->id));
        $this->assertTrue($repository->teamProjects($member, false)->contains('id', $project->id));
        $this->assertSame($member->name, $repository->usersByIds([$member->id])[$member->id]->name);
        $this->assertSame(5.0, $projectHours[$project->id][$member->id]);
    }

    #[Test]
    public function notification_repository_finds_users_and_projects_for_the_command(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $repository = app(CapacityNotificationRepositoryInterface::class);

        $this->assertTrue($repository->findUser($user->id)->is($user));
        $this->assertTrue($repository->findProject($project->id)->is($project));
        $this->assertNull($repository->findUser(999999));
        $this->assertNull($repository->findProject(999999));
    }

    private function createAllocation(Project $project, User $user, array $overrides = []): ProjectAllocation
    {
        return ProjectAllocation::query()->create(array_merge([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'allocated_hours' => 40,
            'used_hours' => 0,
            'percentage' => 50,
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-30',
            'notes' => null,
        ], $overrides));
    }
}
