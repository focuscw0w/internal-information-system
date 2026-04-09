<?php

namespace Modules\Project\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Modules\Project\Enums\NotificationType;
use Modules\Project\Models\Task;

class TaskHoursExceededNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Task $task
    ) {}

    public function via(): array
    {
        return ['database'];
    }

    public function toArray(): array
    {
        $type = NotificationType::TASK_HOURS_EXCEEDED;

        return [
            'type'            => $type->value,
            'title'           => $type->label(),
            'message'         => "Skutočné hodiny úlohy \"{$this->task->title}\" ({$this->task->actual_hours} h) prekročili odhadovaný čas ({$this->task->estimated_hours} h).",
            'project_id'      => $this->task->project_id,
            'project_name'    => $this->task->project?->name ?? '',
            'task_id'         => $this->task->id,
            'task_title'      => $this->task->title,
            'url'             => "/projects/{$this->task->project_id}/tasks/{$this->task->id}",
            'priority'        => $type->priority(),
            'estimated_hours' => $this->task->estimated_hours,
            'actual_hours'    => $this->task->actual_hours,
        ];
    }
}
