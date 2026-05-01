<?php

namespace Modules\Project\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Modules\Project\Enums\NotificationType;
use Modules\Project\Models\Comment;
use Modules\User\Models\User;

class CommentMentionedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Comment $comment,
        private readonly User $author
    ) {}

    public function via(): array
    {
        return ['database'];
    }

    public function toArray(): array
    {
        $type = NotificationType::COMMENT_MENTIONED;
        $task = $this->comment->task;
        $projectId = $task?->project_id;
        $taskId = $task?->id;
        $taskTitle = $task?->title ?? '';
        $projectName = $task?->project?->name ?? '';

        return [
            'type'         => $type->value,
            'title'        => $type->label(),
            'message'      => "{$this->author->name} vás označil v komentári v úlohe \"{$taskTitle}\".",
            'project_id'   => $projectId,
            'project_name' => $projectName,
            'task_id'      => $taskId,
            'task_title'   => $taskTitle,
            'comment_id'   => $this->comment->id,
            'url'          => $taskId
                ? "/projects/{$projectId}/tasks/{$taskId}"
                : '#',
            'priority'     => $type->priority(),
        ];
    }
}
