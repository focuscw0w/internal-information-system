<?php

namespace Modules\Project\Console\Commands;

use Illuminate\Console\Command;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Contracts\Repositories\ProjectRepositoryInterface;
use Modules\Project\Contracts\Repositories\TaskRepositoryInterface;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;

class CheckAtRiskCommand extends Command
{
    protected $signature = 'project:check-at-risk';

    protected $description = 'Skontroluje ohrozené úlohy a projekty a odošle notifikácie';

    public function __construct(
        private readonly NotificationServiceInterface $notificationService,
        private readonly TaskRepositoryInterface $tasks,
        private readonly ProjectRepositoryInterface $projects,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $notified = 0;

        // 1. Stale tasks — in_progress/testing bez aktivity viac ako 7 dni
        $this->tasks->staleInProgressTasks()
            ->each(function (Task $task) use (&$notified) {
                $this->notificationService->notifyAtRisk($task, 'stale');
                $notified++;
            });

        // 2. Todo ulogy s deadline do 3 dni
        $this->tasks->todoTasksDueWithin(3)
            ->each(function (Task $task) use (&$notified) {
                $this->notificationService->notifyAtRisk($task, 'no_progress');
                $notified++;
            });

        // 3. Overdue tasks
        $this->tasks->overdueIncompleteTasks()
            ->each(function (Task $task) use (&$notified) {
                $this->notificationService->notifyAtRisk($task, 'overdue');
                $notified++;
            });

        // 4. Overdue projekty
        $this->projects->overdue()
            ->each(function (Project $project) use (&$notified) {
                $this->notificationService->notifyProjectOverdue($project);
                $notified++;
            });

        $this->info("Skontrolované at-risk záznamy. Odoslaných notifikácií: {$notified}");

        return self::SUCCESS;
    }
}
