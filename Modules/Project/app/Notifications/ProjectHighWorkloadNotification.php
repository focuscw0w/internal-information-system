<?php

namespace Modules\Project\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Modules\Project\Enums\NotificationType;
use Modules\Project\Models\Project;
use Modules\User\Models\User;

class ProjectHighWorkloadNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Project $project,
        private readonly User $assignedBy,
        private readonly string $workload
    ) {}

    public function via(): array
    {
        return ['database'];
    }

    public function toArray(): array
    {
        $type = NotificationType::PROJECT_HIGH_WORKLOAD;

        return [
            'type'         => $type->value,
            'title'        => $type->label(),
            'message'      => "{$this->assignedBy->name} vás pridal do projektu \"{$this->project->name}\", ktorý má vysokú záťaž ({$this->workload}).",
            'project_id'   => $this->project->id,
            'project_name' => $this->project->name,
            'task_id'      => null,
            'task_title'   => null,
            'url'          => "/projects/{$this->project->id}",
            'priority'     => $type->priority(),
            'workload'     => $this->workload,
        ];
    }
}
