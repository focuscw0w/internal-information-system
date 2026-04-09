<?php

namespace Modules\Project\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Modules\Project\Enums\NotificationType;
use Modules\User\Models\User;

class UserOverloadedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly User $user,
        private readonly float $utilization
    ) {}

    public function via(): array
    {
        return ['database'];
    }

    public function toArray(): array
    {
        $type = NotificationType::USER_OVERLOADED;

        return [
            'type'         => $type->value,
            'title'        => $type->label(),
            'message'      => "Vaše aktuálne vyťaženie je {$this->utilization}%, čo prekračuje kapacitu.",
            'project_id'   => null,
            'project_name' => null,
            'task_id'      => null,
            'task_title'   => null,
            'url'          => '/capacity-management',
            'priority'     => $type->priority(),
            'utilization'  => $this->utilization,
        ];
    }
}
