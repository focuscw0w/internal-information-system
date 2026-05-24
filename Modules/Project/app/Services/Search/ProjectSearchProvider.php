<?php

namespace Modules\Project\Services\Search;

use Modules\Project\Contracts\Repositories\CommentRepositoryInterface;
use Modules\Project\Contracts\Repositories\ProjectRepositoryInterface;
use Modules\Project\Contracts\Repositories\TaskRepositoryInterface;
use Modules\Project\Contracts\SearchProviderInterface;
use Modules\Project\Enums\ProjectGlobalPermission;
use Modules\Project\Enums\ProjectPermission;
use Modules\Project\Models\Comment;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\User\Models\User;
use Throwable;

class ProjectSearchProvider implements SearchProviderInterface
{
    public function __construct(
        private readonly ProjectRepositoryInterface $projects,
        private readonly TaskRepositoryInterface $tasks,
        private readonly CommentRepositoryInterface $comments,
    ) {}

    public function search(string $query, User $user, int $perGroup): array
    {
        $term = trim($query);
        $like = '%'.$this->escapeLike($term).'%';
        $visibleProjectIds = $this->projects->visibleProjectIds($user);

        if (mb_strlen($term) < 2) {
            return ['actions' => $this->buildActions($user, $term, $perGroup)];
        }

        return [
            'actions' => $this->buildActions($user, $term, $perGroup),
            'projects' => $this->searchProjects($user, $like, $perGroup),
            'tasks' => $this->searchTasks($visibleProjectIds, $like, $perGroup),
            'comments' => $this->searchComments($visibleProjectIds, $like, $perGroup),
        ];
    }

    private function buildActions(User $user, string $term, int $perGroup): array
    {
        $actions = [];

        if ($user->is_admin || $this->canGlobally($user, ProjectGlobalPermission::PROJECTS_CREATE->value)) {
            $actions[] = SearchActionBuilder::make(
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

        return SearchActionBuilder::filterAndShape($actions, $term, $perGroup);
    }

    private function createTaskActions(User $user, string $term, int $perGroup): array
    {
        $nameLike = null;

        if (mb_strlen($term) >= 2 && ! $this->matchesGenericCreateTaskTerm($term)) {
            $nameLike = '%'.$this->escapeLike($term).'%';
        }

        return $this->projects
            ->latestVisibleForTaskActions($user, $nameLike, $perGroup * 3)
            ->filter(fn (Project $project) => $project->userHasPermission($user, ProjectPermission::CREATE_TASKS->value))
            ->take($perGroup)
            ->map(fn (Project $project) => SearchActionBuilder::make(
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

    private function matchesGenericCreateTaskTerm(string $term): bool
    {
        $haystack = 'nova uloha nová úloha pridat ulohu pridať úlohu create task task uloha';

        return str_contains($haystack, mb_strtolower($term));
    }

    private function searchProjects(User $user, string $like, int $perGroup): array
    {
        return $this->projects
            ->searchVisible($user, $like, $perGroup)
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

        return $this->tasks
            ->searchWithinProjects($visibleProjectIds, $like, $perGroup)
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

        return $this->comments
            ->searchWithinProjects($visibleProjectIds, $like, $perGroup)
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

    private function canGlobally(User $user, string $permission): bool
    {
        try {
            return $user->can($permission);
        } catch (Throwable) {
            return false;
        }
    }
}
