<?php

namespace Modules\CapacityManagement\Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\CapacityManagement\Console\Commands\CheckCapacityNotificationsCommand;
use Modules\CapacityManagement\Contracts\CapacityManagementServiceInterface;
use Modules\CapacityManagement\Contracts\Repositories\CapacityNotificationRepositoryInterface;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Models\Project;
use Modules\User\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CheckCapacityNotificationsCommandTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_calls_notify_user_overloaded_for_each_alert(): void
    {
        $user = User::factory()->create();

        $capacityService = $this->createMock(CapacityManagementServiceInterface::class);
        $capacityService->method('buildDashboard')->willReturn([
            'alerts' => [
                ['id' => $user->id, 'name' => $user->name, 'weekly_utilization' => 115.0],
            ],
            'prediction' => ['projects' => []],
        ]);

        $notificationService = $this->createMock(NotificationServiceInterface::class);
        $notificationService->expects($this->once())
            ->method('notifyUserOverloaded')
            ->with(
                $this->callback(fn ($u) => $u->id === $user->id),
                115.0
            );

        $notificationRepository = $this->createMock(CapacityNotificationRepositoryInterface::class);
        $notificationRepository->expects($this->once())
            ->method('findUser')
            ->with($user->id)
            ->willReturn($user);
        $notificationRepository->expects($this->never())->method('findProject');

        $command = new CheckCapacityNotificationsCommand($capacityService, $notificationService, $notificationRepository);
        $this->app->instance(CheckCapacityNotificationsCommand::class, $command);

        $this->artisan('capacity:check-notifications')->assertExitCode(0);
    }

    #[Test]
    public function it_calls_notify_project_capacity_at_risk_for_projects_that_cannot_finish(): void
    {
        $project = Project::factory()->create();

        $capacityService = $this->createMock(CapacityManagementServiceInterface::class);
        $capacityService->method('buildDashboard')->willReturn([
            'alerts' => [],
            'prediction' => [
                'projects' => [
                    [
                        'id' => $project->id,
                        'can_finish' => false,
                        'days_remaining' => 14,
                        'remaining_hours' => 120.0,
                        'confidence' => 40.0,
                    ],
                ],
            ],
        ]);

        $notificationService = $this->createMock(NotificationServiceInterface::class);
        $notificationService->expects($this->once())
            ->method('notifyProjectCapacityAtRisk')
            ->with(
                $this->callback(fn ($p) => $p->id === $project->id),
                120.0,
                40.0
            );

        $notificationRepository = $this->createMock(CapacityNotificationRepositoryInterface::class);
        $notificationRepository->expects($this->never())->method('findUser');
        $notificationRepository->expects($this->once())
            ->method('findProject')
            ->with($project->id)
            ->willReturn($project);

        $command = new CheckCapacityNotificationsCommand($capacityService, $notificationService, $notificationRepository);
        $this->app->instance(CheckCapacityNotificationsCommand::class, $command);

        $this->artisan('capacity:check-notifications')->assertExitCode(0);
    }

    #[Test]
    public function it_skips_projects_that_are_already_overdue(): void
    {
        $project = Project::factory()->create();

        $capacityService = $this->createMock(CapacityManagementServiceInterface::class);
        $capacityService->method('buildDashboard')->willReturn([
            'alerts' => [],
            'prediction' => [
                'projects' => [
                    [
                        'id' => $project->id,
                        'can_finish' => false,
                        'days_remaining' => 0, // already overdue
                        'remaining_hours' => 50.0,
                        'confidence' => 20.0,
                    ],
                ],
            ],
        ]);

        $notificationService = $this->createMock(NotificationServiceInterface::class);
        $notificationService->expects($this->never())
            ->method('notifyProjectCapacityAtRisk');

        $notificationRepository = $this->createMock(CapacityNotificationRepositoryInterface::class);
        $notificationRepository->expects($this->never())->method('findUser');
        $notificationRepository->expects($this->never())->method('findProject');

        $command = new CheckCapacityNotificationsCommand($capacityService, $notificationService, $notificationRepository);
        $this->app->instance(CheckCapacityNotificationsCommand::class, $command);

        $this->artisan('capacity:check-notifications')->assertExitCode(0);
    }

    #[Test]
    public function it_skips_projects_where_can_finish_is_true(): void
    {
        $project = Project::factory()->create();

        $capacityService = $this->createMock(CapacityManagementServiceInterface::class);
        $capacityService->method('buildDashboard')->willReturn([
            'alerts' => [],
            'prediction' => [
                'projects' => [
                    [
                        'id' => $project->id,
                        'can_finish' => true,
                        'days_remaining' => 10,
                        'remaining_hours' => 20.0,
                        'confidence' => 95.0,
                    ],
                ],
            ],
        ]);

        $notificationService = $this->createMock(NotificationServiceInterface::class);
        $notificationService->expects($this->never())
            ->method('notifyProjectCapacityAtRisk');

        $notificationRepository = $this->createMock(CapacityNotificationRepositoryInterface::class);
        $notificationRepository->expects($this->never())->method('findUser');
        $notificationRepository->expects($this->never())->method('findProject');

        $command = new CheckCapacityNotificationsCommand($capacityService, $notificationService, $notificationRepository);
        $this->app->instance(CheckCapacityNotificationsCommand::class, $command);

        $this->artisan('capacity:check-notifications')->assertExitCode(0);
    }

    #[Test]
    public function it_does_nothing_when_dashboard_has_no_alerts_and_all_projects_finish_on_time(): void
    {
        $capacityService = $this->createMock(CapacityManagementServiceInterface::class);
        $capacityService->method('buildDashboard')->willReturn([
            'alerts' => [],
            'prediction' => ['projects' => []],
        ]);

        $notificationService = $this->createMock(NotificationServiceInterface::class);
        $notificationService->expects($this->never())->method('notifyUserOverloaded');
        $notificationService->expects($this->never())->method('notifyProjectCapacityAtRisk');

        $notificationRepository = $this->createMock(CapacityNotificationRepositoryInterface::class);
        $notificationRepository->expects($this->never())->method('findUser');
        $notificationRepository->expects($this->never())->method('findProject');

        $command = new CheckCapacityNotificationsCommand($capacityService, $notificationService, $notificationRepository);
        $this->app->instance(CheckCapacityNotificationsCommand::class, $command);

        $this->artisan('capacity:check-notifications')->assertExitCode(0);
    }
}
