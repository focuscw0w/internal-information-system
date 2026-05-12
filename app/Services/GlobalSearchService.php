<?php

namespace App\Services;

use App\Enums\PermissionEnum;
use Illuminate\Database\Eloquent\Builder;
use Modules\Project\Enums\ProjectPermission;
use Modules\Project\Models\Comment;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\User\Models\User;
use Throwable;

class GlobalSearchService
{
    public function search(string $query, User $user, int $perGroup = 5): array
    {
        $term = trim($query);
        $like = '%'.$this->escapeLike($term).'%';
        $visibleProjectIds = Project::visibleTo($user)->pluck('id')->all();

        if (mb_strlen($term) < 2) {
            return [
                'actions' => $this->searchActions($user, $term, $perGroup),
                'projects' => [],
                'tasks' => [],
                'users' => [],
                'comments' => [],
            ];
        }

        return [
            'actions' => $this->searchActions($user, $term, $perGroup),
            'projects' => $this->searchProjects($user, $like, $perGroup),
            'tasks' => $this->searchTasks($visibleProjectIds, $like, $perGroup),
            'comments' => $this->searchComments($visibleProjectIds, $like, $perGroup),
            'users' => $this->searchUsers($user, $like, $perGroup),
        ];
    }

    private function searchActions(User $user, string $term, int $perGroup): array
    {
        $actions = [];
        $actionLimit = max($perGroup, 8);

        if ($user->is_admin || $this->hasGlobalPermission($user, PermissionEnum::PROJECTS_CREATE->value)) {
            $actions[] = $this->action(
                'create-project',
                'Vytvoriť projekt',
                'Nový projekt s tímom, termínmi a kapacitou',
                '/projects?action=create-project',
                'folder-plus',
                ['novy projekt', 'nový projekt', 'vytvorit projekt', 'vytvoriť projekt', 'pridat projekt', 'pridať projekt', 'create project']
            );
        }

        foreach ($this->createTaskActions($user, $term, $perGroup) as $action) {
            $actions[] = $action;
        }

        if ($this->canAccessManagerArea($user)) {
            $actions[] = $this->action(
                'manager-dashboard',
                'Tímové riadenie',
                'Prehľad schvaľovaní, rizík, kapacít a tímovej práce',
                '/manager',
                'layout-dashboard',
                ['manager', 'timove riadenie', 'dashboard']
            );

            $actions[] = $this->action(
                'time-reports',
                'Reporty času',
                'Prehľady a exporty odpracovaného času',
                '/manager/time/reports',
                'bar-chart-3',
                ['report', 'reporty', 'cas', 'time reports']
            );
        }

        if ($user->is_admin || Project::whereUserCanManageTimeEntries($user)->exists()) {
            $actions[] = $this->action(
                'time-approvals',
                'Schvaľovania',
                'Schváliť alebo zamietnuť čakajúce záznamy času',
                '/manager/approvals',
                'clipboard-check',
                ['schvalovanie', 'approval', 'approvals', 'time approvals']
            );
        }

        if ($user->is_admin || $this->hasGlobalPermission($user, PermissionEnum::CAPACITY_MANAGE->value)) {
            $actions[] = $this->action(
                'capacity-management',
                'Kapacity',
                'Správa týždenných kapacít a vyťaženia tímu',
                '/capacity-management',
                'activity',
                ['kapacity', 'capacity', 'vytazenie']
            );
        }

        return collect($actions)
            ->filter(fn (array $action) => $this->matchesAction($action, $term))
            ->take($actionLimit)
            ->map(fn (array $action) => [
                'type' => 'action',
                'id' => $action['id'],
                'title' => $action['title'],
                'subtitle' => $action['subtitle'],
                'url' => $action['url'],
                'icon' => $action['icon'],
            ])
            ->values()
            ->all();
    }

    private function createTaskActions(User $user, string $term, int $perGroup): array
    {
        $query = Project::visibleTo($user)
            ->orderByDesc('updated_at')
            ->limit($perGroup * 3);

        if (mb_strlen($term) >= 2 && ! $this->matchesGenericCreateTaskTerm($term)) {
            $like = '%'.$this->escapeLike($term).'%';
            $query->where('name', 'like', $like);
        }

        return $query
            ->get(['id', 'name', 'owner_id', 'updated_at'])
            ->filter(fn (Project $project) => $project->userHasPermission($user, ProjectPermission::CREATE_TASKS->value))
            ->take($perGroup)
            ->map(fn (Project $project) => $this->action(
                "create-task-{$project->id}",
                "Nová úloha v {$project->name}",
                'Otvoriť formulár novej úlohy v projekte',
                "/projects/{$project->id}?action=create-task",
                'plus-circle',
                ['nova uloha', 'nová úloha', 'pridat ulohu', 'pridať úlohu', 'create task', $project->name]
            ))
            ->values()
            ->all();
    }

    private function action(string $id, string $title, string $subtitle, string $url, string $icon, array $keywords): array
    {
        return compact('id', 'title', 'subtitle', 'url', 'icon', 'keywords');
    }

    private function matchesAction(array $action, string $term): bool
    {
        if ($term === '') {
            return true;
        }

        $haystack = mb_strtolower(implode(' ', [
            $action['title'],
            $action['subtitle'],
            ...$action['keywords'],
        ]));

        return str_contains($haystack, mb_strtolower($term));
    }

    private function matchesGenericCreateTaskTerm(string $term): bool
    {
        $haystack = 'nova uloha nová úloha pridat ulohu pridať úlohu create task task uloha';

        return str_contains($haystack, mb_strtolower($term));
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
        $canViewAll = $user->is_admin || $this->hasGlobalPermission($user, PermissionEnum::USERS_VIEW->value);

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

    private function canAccessManagerArea(User $user): bool
    {
        return $user->is_admin
            || $this->hasGlobalPermission($user, PermissionEnum::CAPACITY_MANAGE->value)
            || Project::managedBy($user)->exists()
            || Project::whereUserCanManageTimeEntries($user)->exists();
    }

    private function hasGlobalPermission(User $user, string $permission): bool
    {
        try {
            return $user->can($permission);
        } catch (Throwable) {
            return false;
        }
    }
}
