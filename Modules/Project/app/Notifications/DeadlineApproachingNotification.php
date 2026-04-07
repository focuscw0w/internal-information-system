<?php

namespace Modules\Project\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Modules\Project\Enums\NotificationType;
use Modules\Project\Models\Task;

class DeadlineApproachingNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Task $task,
        private readonly int $daysRemaining
    ) {}

    public function via(): array
    {
        return ['database'];
    }

    public function toArray(): array
    {
        $type = NotificationType::DEADLINE_APPROACHING;

        return [
            'type'         => $type->value,
            'title'        => $type->label(),
            'message'      => "Úloha \"{$this->task->title}\" má termín o {$this->daysRemaining} " . ($this->daysRemaining === 1 ? 'deň' : 'dni') . '.',
            'project_id'   => $this->task->project_id,
            'project_name' => $this->task->project?->name ?? '',
            'task_id'      => $this->task->id,
            'task_title'   => $this->task->title,
            'url'          => "/projects/{$this->task->project_id}/tasks/{$this->task->id}",
            'priority'     => $type->priority(),
            'days_remaining' => $this->daysRemaining,
        ];
    }
}
