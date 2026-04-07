<?php

namespace Modules\Project\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Modules\Project\Enums\NotificationType;
use Modules\Project\Enums\TaskStatus;
use Modules\Project\Models\Task;
use Modules\User\Models\User;

class TaskStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Task $task,
        private readonly string $oldStatus,
        private readonly string $newStatus,
        private readonly User $changedBy
    ) {}

    public function via(): array
    {
        return ['database'];
    }

    public function toArray(): array
    {
        $type = NotificationType::TASK_STATUS_CHANGED;

        $oldLabel = TaskStatus::from($this->oldStatus)->label();
        $newLabel = TaskStatus::from($this->newStatus)->label();

        return [
            'type'         => $type->value,
            'title'        => $type->label(),
            'message'      => "{$this->changedBy->name} zmenil stav úlohy \"{$this->task->title}\" z \"{$oldLabel}\" na \"{$newLabel}\".",
            'project_id'   => $this->task->project_id,
            'project_name' => $this->task->project?->name ?? '',
            'task_id'      => $this->task->id,
            'task_title'   => $this->task->title,
            'url'          => "/projects/{$this->task->project_id}/tasks/{$this->task->id}",
            'priority'     => $type->priority(),
            'old_status'   => $this->oldStatus,
            'new_status'   => $this->newStatus,
        ];
    }
}
