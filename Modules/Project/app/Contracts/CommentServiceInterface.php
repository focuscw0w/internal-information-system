<?php

namespace Modules\Project\Contracts;

use Modules\Project\Models\Comment;
use Modules\Project\Models\Task;

interface CommentServiceInterface
{
    public function store(Task $task, int $userId, array $data): Comment;
}
