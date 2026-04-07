<?php

namespace Modules\Project\Console\Commands;

use Illuminate\Console\Command;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Models\Task;

class CheckDeadlinesCommand extends Command
{
    protected $signature = 'project:check-deadlines';

    protected $description = 'Skontroluje blížiace sa deadliny úloh a odošle notifikácie';

    public function __construct(private readonly NotificationServiceInterface $notificationService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $targetDays = [1, 3];
        $notified = 0;

        foreach ($targetDays as $days) {
            $targetDate = now()->addDays($days)->toDateString();

            Task::whereDate('due_date', $targetDate)
                ->where('status', '!=', 'done')
                ->with(['assignedUsers', 'project.owner'])
                ->has('assignedUsers')
                ->each(function (Task $task) use ($days, &$notified) {
                    $this->notificationService->notifyDeadlineApproaching($task, $days);
                    $notified++;
                });
        }

        $this->info("Skontrolované deadliny. Odoslaných notifikácií: {$notified}");

        return self::SUCCESS;
    }
}
