<?php

namespace Modules\Project\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Modules\Project\Enums\NotificationType;
use Modules\Project\Models\Project;

class ProjectCapacityAtRiskNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Project $project,
        private readonly float $remainingHours,
        private readonly float $confidence
    ) {}

    public function via(): array
    {
        return ['database'];
    }

    public function toArray(): array
    {
        $type = NotificationType::PROJECT_CAPACITY_AT_RISK;

        return [
            'type'            => $type->value,
            'title'           => $type->label(),
            'message'         => "Projekt \"{$this->project->name}\" nemusí byť dokončený včas. Zostatok: {$this->remainingHours} h, istota: {$this->confidence}%.",
            'project_id'      => $this->project->id,
            'project_name'    => $this->project->name,
            'task_id'         => null,
            'task_title'      => null,
            'url'             => "/projects/{$this->project->id}",
            'priority'        => $type->priority(),
            'remaining_hours' => $this->remainingHours,
            'confidence'      => $this->confidence,
        ];
    }
}
