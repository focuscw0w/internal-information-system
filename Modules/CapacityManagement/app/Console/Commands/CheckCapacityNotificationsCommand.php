<?php

namespace Modules\CapacityManagement\Console\Commands;

use Illuminate\Console\Command;
use Modules\CapacityManagement\Contracts\CapacityManagementServiceInterface;
use Modules\CapacityManagement\Contracts\Repositories\CapacityNotificationRepositoryInterface;
use Modules\Project\Contracts\NotificationServiceInterface;

class CheckCapacityNotificationsCommand extends Command
{
    protected $signature = 'capacity:check-notifications';

    protected $description = 'Skontroluje kapacitu tímu a odošle notifikácie o preťažení a ohrozených projektoch';

    public function __construct(
        private readonly CapacityManagementServiceInterface $capacityService,
        private readonly NotificationServiceInterface $notificationService,
        private readonly CapacityNotificationRepositoryInterface $capacityNotifications,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dashboard = $this->capacityService->buildDashboard();
        $notified = 0;

        // 1. USER_OVERLOADED — používatelia s utilization > 100%
        foreach ($dashboard['alerts'] as $alert) {
            $user = $this->capacityNotifications->findUser((int) $alert['id']);
            if ($user) {
                $this->notificationService->notifyUserOverloaded($user, $alert['weekly_utilization']);
                $notified++;
            }
        }

        // 2. PROJECT_CAPACITY_AT_RISK — projekty kde can_finish = false a ešte nie sú overdue
        foreach ($dashboard['prediction']['projects'] as $projectData) {
            if (! $projectData['can_finish'] && $projectData['days_remaining'] > 0) {
                $project = $this->capacityNotifications->findProject((int) $projectData['id']);
                if ($project) {
                    $this->notificationService->notifyProjectCapacityAtRisk(
                        $project,
                        $projectData['remaining_hours'],
                        $projectData['confidence'],
                    );
                    $notified++;
                }
            }
        }

        $this->info("Kapacitné notifikácie odoslané: {$notified}");

        return self::SUCCESS;
    }
}
