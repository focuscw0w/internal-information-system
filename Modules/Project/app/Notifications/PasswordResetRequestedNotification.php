<?php

namespace Modules\Project\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Modules\Project\Enums\NotificationType;
use Modules\User\Models\User;

class PasswordResetRequestedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly User $requestingUser) {}

    public function via(): array
    {
        return ['database'];
    }

    public function toArray(): array
    {
        $type = NotificationType::PASSWORD_RESET_REQUESTED;

        return [
            'type'     => $type->value,
            'title'    => $type->label(),
            'message'  => "{$this->requestingUser->name} požiadal o reset hesla.",
            'user_id'  => $this->requestingUser->id,
            'url'      => "/users?edit={$this->requestingUser->id}",
            'priority' => $type->priority(),
        ];
    }
}
