<?php

namespace Modules\Project\Services;

use Modules\Project\Contracts\CommentServiceInterface;
use Modules\Project\Models\Comment;
use Modules\Project\Models\Task;

class CommentService implements CommentServiceInterface
{
    /**
     * Store a new comment for the given task.
     */
    public function store(Task $task, int $userId, array $data): Comment
    {
        return $task->comments()->create([
            'user_id' => $userId,
            'body' => $data['body'],
        ]);
    }
}
