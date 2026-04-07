<?php

namespace Modules\Project\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Modules\Project\Enums\NotificationType;
use Modules\Project\Models\Task;
use Modules\User\Models\User;

class TaskAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Task $task,
        private readonly User $assignedBy
    ) {}

    public function via(): array
    {
        return ['database'];
    }

    public function toArray(): array
    {
        $type = NotificationType::TASK_ASSIGNED;

        return [
            'type'         => $type->value,
            'title'        => $type->label(),
            'message'      => "{$this->assignedBy->name} vás priradil k úlohe \"{$this->task->title}\".",
            'project_id'   => $this->task->project_id,
            'project_name' => $this->task->project?->name ?? '',
            'task_id'      => $this->task->id,
            'task_title'   => $this->task->title,
            'url'          => "/projects/{$this->task->project_id}/tasks/{$this->task->id}",
            'priority'     => $type->priority(),
        ];
    }
}
