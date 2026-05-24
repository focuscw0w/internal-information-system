<?php

namespace Modules\TimeTracking\Tests\Unit;

use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Contracts\ProjectAllocationSyncInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\TimeTracking\Contracts\Repositories\TimeEntryRepositoryInterface;
use Modules\TimeTracking\Contracts\Repositories\TimeTrackingProjectRepositoryInterface;
use Modules\TimeTracking\Contracts\Repositories\TimeTrackingTaskRepositoryInterface;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\TimeTracking\Services\TimeEntryService;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TimeEntryServiceRepositoryMockTest extends TestCase
{
    #[Test]
    public function create_uses_repositories_and_runs_sync_side_effects(): void
    {
        $entry = new TimeEntry([
            'project_id' => 10,
            'task_id' => 20,
            'user_id' => 30,
            'hours' => 2,
        ]);

        $timeEntries = $this->createMock(TimeEntryRepositoryInterface::class);
        $timeEntries->expects($this->once())->method('create')->willReturn($entry);
        $timeEntries->expects($this->once())->method('totalHoursForTask')->with(20)->willReturn(2.0);

        $tasks = $this->createMock(TimeTrackingTaskRepositoryInterface::class);
        $tasks->expects($this->once())->method('updateActualHours')->with(20, 2.0);
        $tasks->expects($this->once())->method('findForHoursExceededCheck')->with(20)->willReturn(new Task([
            'estimated_hours' => 8,
            'actual_hours' => 2,
        ]));

        $allocationSync = $this->createMock(ProjectAllocationSyncInterface::class);
        $allocationSync->expects($this->once())->method('syncUsedHoursForProjectUser')->with(10, 30);

        $notificationService = $this->createMock(NotificationServiceInterface::class);
        $notificationService->expects($this->never())->method('notifyTaskHoursExceeded');

        $service = new TimeEntryService(
            $notificationService,
            $timeEntries,
            $this->createMock(TimeTrackingProjectRepositoryInterface::class),
            $tasks,
            $allocationSync,
        );

        $this->assertSame($entry, $service->create(['hours' => 2]));
    }

    #[Test]
    public function update_uses_repositories_and_resyncs_task_and_allocation_hours(): void
    {
        $actor = User::factory()->make(['id' => 99]);
        $this->actingAs($actor);

        $entry = new TimeEntry([
            'id' => 1,
            'project_id' => 10,
            'task_id' => 20,
            'user_id' => 30,
        ]);
        $project = $this->projectAllowingManageTimeEntries($actor);

        $timeEntries = $this->createMock(TimeEntryRepositoryInterface::class);
        $timeEntries->expects($this->once())->method('findOrFail')->with(1)->willReturn($entry);
        $timeEntries->expects($this->once())->method('update')->with($entry, ['hours' => 5])->willReturn(true);
        $timeEntries->expects($this->once())->method('totalHoursForTask')->with(20)->willReturn(5.0);

        $projects = $this->createMock(TimeTrackingProjectRepositoryInterface::class);
        $projects->expects($this->once())->method('findOrFail')->with(10)->willReturn($project);

        $tasks = $this->createMock(TimeTrackingTaskRepositoryInterface::class);
        $tasks->expects($this->once())->method('updateActualHours')->with(20, 5.0);
        $tasks->expects($this->once())->method('findForHoursExceededCheck')->with(20)->willReturn(new Task([
            'estimated_hours' => 10,
            'actual_hours' => 5,
        ]));

        $allocationSync = $this->createMock(ProjectAllocationSyncInterface::class);
        $allocationSync->expects($this->once())->method('syncUsedHoursForProjectUser')->with(10, 30);

        $service = new TimeEntryService(
            $this->createMock(NotificationServiceInterface::class),
            $timeEntries,
            $projects,
            $tasks,
            $allocationSync,
        );

        $this->assertTrue($service->update(1, ['hours' => 5]));
    }

    #[Test]
    public function delete_uses_repositories_and_resyncs_task_and_allocation_hours(): void
    {
        $actor = User::factory()->make(['id' => 99]);
        $this->actingAs($actor);

        $entry = new TimeEntry([
            'id' => 1,
            'project_id' => 10,
            'task_id' => 20,
            'user_id' => 30,
        ]);
        $project = $this->projectAllowingManageTimeEntries($actor);

        $timeEntries = $this->createMock(TimeEntryRepositoryInterface::class);
        $timeEntries->expects($this->once())->method('findOrFail')->with(1)->willReturn($entry);
        $timeEntries->expects($this->once())->method('delete')->with($entry)->willReturn(true);
        $timeEntries->expects($this->once())->method('totalHoursForTask')->with(20)->willReturn(0.0);

        $projects = $this->createMock(TimeTrackingProjectRepositoryInterface::class);
        $projects->expects($this->once())->method('findOrFail')->with(10)->willReturn($project);

        $tasks = $this->createMock(TimeTrackingTaskRepositoryInterface::class);
        $tasks->expects($this->once())->method('updateActualHours')->with(20, 0.0);
        $tasks->expects($this->once())->method('findForHoursExceededCheck')->with(20)->willReturn(new Task([
            'estimated_hours' => 10,
            'actual_hours' => 0,
        ]));

        $allocationSync = $this->createMock(ProjectAllocationSyncInterface::class);
        $allocationSync->expects($this->once())->method('syncUsedHoursForProjectUser')->with(10, 30);

        $service = new TimeEntryService(
            $this->createMock(NotificationServiceInterface::class),
            $timeEntries,
            $projects,
            $tasks,
            $allocationSync,
        );

        $this->assertTrue($service->delete(1));
    }

    private function projectAllowingManageTimeEntries(User $actor): Project
    {
        $project = $this->getMockBuilder(Project::class)
            ->onlyMethods(['userHasPermission'])
            ->getMock();
        $project->expects($this->once())
            ->method('userHasPermission')
            ->with($actor, 'manage_time_entries')
            ->willReturn(true);

        return $project;
    }
}
