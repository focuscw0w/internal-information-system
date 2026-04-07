<?php

namespace Modules\Project\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Modules\Project\Enums\NotificationType;
use Modules\Project\Models\Project;

class ProjectOverdueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Project $project
    ) {}

    public function via(): array
    {
        return ['database'];
    }

    public function toArray(): array
    {
        $type = NotificationType::PROJECT_OVERDUE;

        $daysOverdue = now()->diffInDays($this->project->end_date);

        return [
            'type'         => $type->value,
            'title'        => $type->label(),
            'message'      => "Projekt \"{$this->project->name}\" prekročil termín o {$daysOverdue} " . ($daysOverdue === 1 ? 'deň' : 'dní') . '.',
            'project_id'   => $this->project->id,
            'project_name' => $this->project->name,
            'task_id'      => null,
            'task_title'   => null,
            'url'          => "/projects/{$this->project->id}",
            'priority'     => $type->priority(),
        ];
    }
}
