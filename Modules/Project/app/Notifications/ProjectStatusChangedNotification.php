<?php

namespace Modules\Project\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Modules\Project\Enums\NotificationType;
use Modules\Project\Enums\ProjectStatus;
use Modules\Project\Models\Project;
use Modules\User\Models\User;

class ProjectStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Project $project,
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
        $type = NotificationType::PROJECT_STATUS_CHANGED;

        $oldLabel = ProjectStatus::tryFrom($this->oldStatus)?->label() ?? $this->oldStatus;
        $newLabel = ProjectStatus::tryFrom($this->newStatus)?->label() ?? $this->newStatus;

        return [
            'type'         => $type->value,
            'title'        => $type->label(),
            'message'      => "{$this->changedBy->name} zmenil stav projektu \"{$this->project->name}\" z \"{$oldLabel}\" na \"{$newLabel}\".",
            'project_id'   => $this->project->id,
            'project_name' => $this->project->name,
            'task_id'      => null,
            'task_title'   => null,
            'url'          => "/projects/{$this->project->id}",
            'priority'     => $type->priority(),
            'old_status'   => $this->oldStatus,
            'new_status'   => $this->newStatus,
        ];
    }
}
