<?php

namespace Modules\Project\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Modules\Project\Enums\NotificationType;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;

class AtRiskNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Task|Project $subject,
        private readonly string $reason
    ) {}

    public function via(): array
    {
        return ['database'];
    }

    public function toArray(): array
    {
        $type = NotificationType::TASK_AT_RISK;

        $reasonLabel = match ($this->reason) {
            'overdue'      => 'je po termíne',
            'stale'        => 'nemá žiadnu aktivitu viac ako 7 dní',
            'no_progress'  => 'blíži sa termín, ale úloha ešte nezačala',
            default        => 'vyžaduje pozornosť',
        };

        if ($this->subject instanceof Task) {
            return [
                'type'         => $type->value,
                'title'        => $type->label(),
                'message'      => "Úloha \"{$this->subject->title}\" {$reasonLabel}.",
                'project_id'   => $this->subject->project_id,
                'project_name' => $this->subject->project?->name ?? '',
                'task_id'      => $this->subject->id,
                'task_title'   => $this->subject->title,
                'url'          => "/projects/{$this->subject->project_id}/tasks/{$this->subject->id}",
                'priority'     => $type->priority(),
                'reason'       => $this->reason,
            ];
        }

        return [
            'type'         => $type->value,
            'title'        => $type->label(),
            'message'      => "Projekt \"{$this->subject->name}\" {$reasonLabel}.",
            'project_id'   => $this->subject->id,
            'project_name' => $this->subject->name,
            'task_id'      => null,
            'task_title'   => null,
            'url'          => "/projects/{$this->subject->id}",
            'priority'     => $type->priority(),
            'reason'       => $this->reason,
        ];
    }
}
