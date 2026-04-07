<?php

namespace Modules\Project\Console\Commands;

use Illuminate\Console\Command;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;

class CheckAtRiskCommand extends Command
{
    protected $signature = 'project:check-at-risk';

    protected $description = 'Skontroluje ohrozené úlohy a projekty a odošle notifikácie';

    public function __construct(private readonly NotificationServiceInterface $notificationService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $notified = 0;

        // 1. Stale tasks — in_progress/testing bez aktivity viac ako 7 dni
        Task::whereIn('status', ['in_progress', 'testing'])
            ->where('updated_at', '<', now()->subDays(7))
            ->with(['assignedUsers', 'project.owner'])
            ->each(function (Task $task) use (&$notified) {
                $this->notificationService->notifyAtRisk($task, 'stale');
                $notified++;
            });

        // 2. Todo ulogy s deadline do 3 dni
        Task::where('status', 'todo')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '>=', now()->toDateString())
            ->whereDate('due_date', '<=', now()->addDays(3)->toDateString())
            ->with(['assignedUsers', 'project.owner'])
            ->each(function (Task $task) use (&$notified) {
                $this->notificationService->notifyAtRisk($task, 'no_progress');
                $notified++;
            });

        // 3. Overdue tasks
        Task::where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', now()->toDateString())
            ->with(['assignedUsers', 'project.owner'])
            ->each(function (Task $task) use (&$notified) {
                $this->notificationService->notifyAtRisk($task, 'overdue');
                $notified++;
            });

        // 4. Overdue projekty
        Project::whereNotIn('status', ['completed', 'cancelled'])
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', now()->toDateString())
            ->with('owner')
            ->each(function (Project $project) use (&$notified) {
                $this->notificationService->notifyProjectOverdue($project);
                $notified++;
            });

        $this->info("Skontrolované at-risk záznamy. Odoslaných notifikácií: {$notified}");

        return self::SUCCESS;
    }
}
