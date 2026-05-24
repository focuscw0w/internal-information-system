<?php

namespace Modules\Project\Contracts\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;
use Modules\Project\Models\Comment;
use Modules\Project\Models\CommentAttachment;
use Modules\Project\Models\Task;

interface CommentRepositoryInterface
{
    public function createForTask(Task $task, array $data): Comment;

    public function createAttachment(array $data): CommentAttachment;

    public function insertMentions(array $rows): void;

    public function usersByIds(SupportCollection $userIds): Collection;

    public function searchWithinProjects(array $projectIds, string $like, int $limit): Collection;
}
