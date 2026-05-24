<?php

namespace Modules\CapacityManagement\Tests\Unit;

use Modules\CapacityManagement\Contracts\Repositories\CapacityForecastRepositoryInterface;
use Modules\CapacityManagement\Contracts\Repositories\EmployeeCapacityRepositoryInterface;
use Modules\CapacityManagement\Services\CapacityCalculator;
use Modules\CapacityManagement\Services\CapacityManagementService;
use Modules\Project\Contracts\ProjectAllocationSyncInterface;
use Modules\Project\Contracts\ProjectServiceInterface;
use Modules\TimeTracking\Contracts\TimeEntryServiceInterface;
use Modules\User\Contracts\UserServiceInterface;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CapacityManagementServiceRepositoryMockTest extends TestCase
{
    #[Test]
    public function set_weekly_capacity_delegates_write_to_repository_and_syncs_allocations(): void
    {
        $employeeCapacities = $this->createMock(EmployeeCapacityRepositoryInterface::class);
        $employeeCapacities->expects($this->once())
            ->method('updateOrCreateWeeklyCapacity')
            ->with(123, 32);

        $allocationSync = $this->createMock(ProjectAllocationSyncInterface::class);
        $allocationSync->expects($this->once())
            ->method('syncAllocationsForUserProjects')
            ->with(123);

        $service = new CapacityManagementService(
            $this->createMock(UserServiceInterface::class),
            $this->createMock(TimeEntryServiceInterface::class),
            $this->createMock(ProjectServiceInterface::class),
            $this->createMock(CapacityCalculator::class),
            $allocationSync,
            $employeeCapacities,
            $this->createMock(CapacityForecastRepositoryInterface::class),
        );

        $service->setWeeklyCapacityForUser(123, 32);
    }
}
