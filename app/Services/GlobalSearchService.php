<?php

namespace App\Services;

use App\Enums\PermissionEnum;
use Illuminate\Database\Eloquent\Builder;
use Modules\Project\Models\Comment;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\User\Models\User;

class GlobalSearchService
{
    public function search(string $query, User $user, int $perGroup = 5): array
    {
        $term = trim($query);
        if (mb_strlen($term) < 2) {
            return [
                'projects' => [],
                'tasks' => [],
                'users' => [],
                'comments' => [],
            ];
        }

        $like = '%'.$this->escapeLike($term).'%';

        $visibleProjectIds = Project::visibleTo($user)->pluck('id')->all();

        return [
            'projects' => $this->searchProjects($user, $like, $perGroup),
            'tasks' => $this->searchTasks($visibleProjectIds, $like, $perGroup),
            'comments' => $this->searchComments($visibleProjectIds, $like, $perGroup),
            'users' => $this->searchUsers($user, $like, $perGroup),
        ];
    }

    private function searchProjects(User $user, string $like, int $perGroup): array
    {
        return Project::visibleTo($user)
            ->where(function (Builder $q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('description', 'like', $like);
            })
            ->orderByDesc('updated_at')
            ->limit($perGroup)
            ->get(['id', 'name', 'status'])
            ->map(fn (Project $project) => [
                'type' => 'project',
                'id' => $project->id,
                'title' => $project->name,
                'subtitle' => $this->statusLabel($project->status),
                'url' => "/projects/{$project->id}",
                'icon' => 'folder-open',
            ])
            ->all();
    }

    private function searchTasks(array $visibleProjectIds, string $like, int $perGroup): array
    {
        if (empty($visibleProjectIds)) {
            return [];
        }

        return Task::query()
            ->whereIn('project_id', $visibleProjectIds)
            ->where(function (Builder $q) use ($like) {
                $q->where('title', 'like', $like)
                    ->orWhere('description', 'like', $like);
            })
            ->with('project:id,name')
            ->orderByDesc('updated_at')
            ->limit($perGroup)
            ->get(['id', 'project_id', 'title', 'status'])
            ->map(fn (Task $task) => [
                'type' => 'task',
                'id' => $task->id,
                'title' => $task->title,
                'subtitle' => $task->project?->name ?? '',
                'url' => "/projects/{$task->project_id}/tasks/{$task->id}",
                'icon' => 'check-square',
            ])
            ->all();
    }

    private function searchComments(array $visibleProjectIds, string $like, int $perGroup): array
    {
        if (empty($visibleProjectIds)) {
            return [];
        }

        return Comment::query()
            ->whereHas('task', fn (Builder $q) => $q->whereIn('project_id', $visibleProjectIds))
            ->where('body', 'like', $like)
            ->with(['task:id,project_id,title', 'task.project:id,name'])
            ->orderByDesc('created_at')
            ->limit($perGroup)
            ->get(['id', 'task_id', 'body'])
            ->map(function (Comment $comment) {
                $snippet = mb_substr(strip_tags($comment->body), 0, 80);

                return [
                    'type' => 'comment',
                    'id' => $comment->id,
                    'title' => $snippet,
                    'subtitle' => trim(($comment->task?->project?->name ?? '').' · '.($comment->task?->title ?? ''), ' ·'),
                    'url' => $comment->task
                        ? "/projects/{$comment->task->project_id}/tasks/{$comment->task->id}"
                        : '#',
                    'icon' => 'message-square',
                ];
            })
            ->all();
    }

    private function searchUsers(User $user, string $like, int $perGroup): array
    {
        $canViewAll = $user->hasPermissionTo(PermissionEnum::USERS_VIEW->value);

        $query = User::query()
            ->where(function (Builder $q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like);
            });

        if (! $canViewAll) {
            $sharedUserIds = Project::visibleTo($user)
                ->with('team:id')
                ->get()
                ->flatMap(fn (Project $project) => $project->team->pluck('id'))
                ->push($user->id)
                ->unique()
                ->values()
                ->all();

            if (empty($sharedUserIds)) {
                return [];
            }

            $query->whereIn('id', $sharedUserIds);
        }

        return $query
            ->orderBy('name')
            ->limit($perGroup)
            ->get(['id', 'name', 'email'])
            ->map(fn (User $u) => [
                'type' => 'user',
                'id' => $u->id,
                'title' => $u->name,
                'subtitle' => $u->email,
                'url' => "/users/{$u->id}",
                'icon' => 'user',
            ])
            ->all();
    }

    private function statusLabel(?string $status): string
    {
        return match ($status) {
            'active' => 'Aktívny',
            'planning' => 'Plánovanie',
            'completed' => 'Dokončený',
            'on_hold' => 'Pozastavený',
            'cancelled' => 'Zrušený',
            default => (string) $status,
        };
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }
}
