<?php

namespace Modules\Project\Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Project\Contracts\Repositories\ProjectAllocationRepositoryInterface;
use Modules\Project\Contracts\Repositories\ProjectNotificationRepositoryInterface;
use Modules\Project\Contracts\Repositories\ProjectRepositoryInterface;
use Modules\Project\Contracts\Repositories\TaskDependencyRepositoryInterface;
use Modules\Project\Contracts\Repositories\TaskRepositoryInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\ProjectAllocation;
use Modules\Project\Models\Task;
use Modules\Project\Notifications\ProjectOverdueNotification;
use Modules\TimeTracking\Enums\TimeEntryStatusEnum;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProjectRepositoriesTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function project_repository_lists_visible_projects_with_filters(): void
    {
        $owner = User::factory()->create(['is_admin' => true]);
        $otherOwner = User::factory()->create();
        $visible = Project::factory()->create([
            'owner_id' => $owner->id,
            'status' => 'active',
            'priority' => 'high',
            'name' => 'ERP rollout',
        ]);
        Project::factory()->create([
            'owner_id' => $owner->id,
            'status' => 'planning',
            'priority' => 'medium',
        ]);
        Project::factory()->create([
            'owner_id' => $otherOwner->id,
            'status' => 'active',
            'priority' => 'high',
            'name' => 'Hidden project',
        ]);

        $projects = app(ProjectRepositoryInterface::class)->visibleTo($owner, [
            'status' => 'active',
            'priority' => 'high',
            'search' => 'ERP',
        ]);

        $this->assertCount(1, $projects);
        $this->assertTrue($projects->first()->is($visible));
    }

    #[Test]
    public function project_repository_returns_statistics_and_overdue_projects(): void
    {
        $owner = User::factory()->create();
        $overdue = Project::factory()->create([
            'owner_id' => $owner->id,
            'status' => 'active',
            'end_date' => now()->subDay(),
            'capacity_used' => 60,
            'tasks_completed' => 2,
            'tasks_total' => 4,
        ]);
        Project::factory()->create([
            'owner_id' => $owner->id,
            'status' => 'completed',
            'end_date' => now()->subDays(2),
        ]);

        $repository = app(ProjectRepositoryInterface::class);

        $this->assertTrue($repository->overdue()->contains(fn (Project $project) => $project->is($overdue)));
        $this->assertSame(1, $repository->statistics()['overdue']);
    }

    #[Test]
    public function task_repository_returns_deadline_and_at_risk_queries(): void
    {
        $project = Project::factory()->create();
        $assignee = User::factory()->create();

        $stale = Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'in_progress',
            'updated_at' => now()->subDays(8),
        ]);
        $dueSoon = Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'todo',
            'due_date' => now()->addDay(),
        ]);
        $overdue = Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'testing',
            'due_date' => now()->subDay(),
        ]);
        $dueSoon->assignedUsers()->sync([$assignee->id]);

        $repository = app(TaskRepositoryInterface::class);

        $this->assertTrue($repository->staleInProgressTasks()->contains(fn (Task $task) => $task->is($stale)));
        $this->assertTrue($repository->todoTasksDueWithin(3)->contains(fn (Task $task) => $task->is($dueSoon)));
        $this->assertTrue($repository->overdueIncompleteTasks()->contains(fn (Task $task) => $task->is($overdue)));
        $this->assertTrue($repository->dueIncompleteAssignedTasks(now()->addDay()->toDateString())->contains(fn (Task $task) => $task->is($dueSoon)));
    }

    #[Test]
    public function allocation_repository_updates_allocations_and_sums_used_hours(): void
    {
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id]);
        $user = User::factory()->create();
        $repository = app(ProjectAllocationRepositoryInterface::class);
        $startDate = '2026-05-01';
        $endDate = '2026-05-31';

        $allocation = $repository->create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'allocated_hours' => 40,
            'used_hours' => 0,
            'percentage' => 50,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);
        ProjectAllocation::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'allocated_hours' => 10,
            'used_hours' => 0,
            'percentage' => 10,
            'start_date' => now()->subWeek()->startOfWeek()->toDateString(),
            'end_date' => now()->subWeek()->endOfWeek()->toDateString(),
        ]);
        TimeEntry::create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $user->id,
            'entry_date' => '2026-05-15',
            'hours' => 3.5,
            'status' => TimeEntryStatusEnum::Approved->value,
        ]);

        $repository->update($allocation, ['used_hours' => 4]);

        $this->assertSame(4, $allocation->fresh()->used_hours);
        $this->assertSame(3.5, $repository->sumUsedHours($project->id, $user->id, $startDate, $endDate));
        $this->assertSame(1, $repository->deleteDuplicateAllocations($project->id, $user->id, $allocation->id));
    }

    #[Test]
    public function dependency_repository_exposes_cycle_detection_support_queries(): void
    {
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id]);
        $predecessor = Task::factory()->create(['project_id' => $project->id]);
        $upstream = Task::factory()->create(['project_id' => $project->id]);
        $repository = app(TaskDependencyRepositoryInterface::class);

        $repository->attachPredecessor($task, $predecessor->id);
        $repository->attachPredecessor($predecessor, $upstream->id);

        $this->assertSame(3, $repository->countProjectTasks($project->id));
        $this->assertSame(2, $repository->countSameProjectTasks([$predecessor->id, $upstream->id], $project->id));
        $this->assertSame([$predecessor->id], $repository->predecessorIds($task));
        $this->assertSame([$upstream->id], array_map('intval', $repository->upstreamTaskIds($predecessor->id)));
    }

    #[Test]
    public function notification_repository_detects_recent_duplicate_notifications(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $repository = app(ProjectNotificationRepositoryInterface::class);

        $user->notifications()->create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => ProjectOverdueNotification::class,
            'data' => ['project_id' => $project->id],
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertTrue($repository->recentUnreadMatching(
            $user,
            ProjectOverdueNotification::class,
            fn ($notification) => ($notification->data['project_id'] ?? null) === $project->id,
        ));
    }
}
