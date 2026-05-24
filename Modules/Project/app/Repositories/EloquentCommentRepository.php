<?php

namespace Modules\Project\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Facades\DB;
use Modules\Project\Contracts\Repositories\CommentRepositoryInterface;
use Modules\Project\Models\Comment;
use Modules\Project\Models\CommentAttachment;
use Modules\Project\Models\Task;
use Modules\User\Models\User;

class EloquentCommentRepository implements CommentRepositoryInterface
{
    public function createForTask(Task $task, array $data): Comment
    {
        return $task->comments()->create($data);
    }

    public function createAttachment(array $data): CommentAttachment
    {
        return CommentAttachment::create($data);
    }

    public function insertMentions(array $rows): void
    {
        DB::table('comment_mentions')->insertOrIgnore($rows);
    }

    public function usersByIds(SupportCollection $userIds): Collection
    {
        return User::whereIn('id', $userIds)->get(['id', 'name', 'email']);
    }

    public function searchWithinProjects(array $projectIds, string $like, int $limit): Collection
    {
        return Comment::query()
            ->whereHas('task', fn ($query) => $query->whereIn('project_id', $projectIds))
            ->where('body', 'like', $like)
            ->with(['task:id,project_id,title', 'task.project:id,name'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get(['id', 'task_id', 'body']);
    }
}
