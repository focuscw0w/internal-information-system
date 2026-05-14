<?php

namespace Modules\User\Services\Search;

use Illuminate\Database\Eloquent\Builder;
use Modules\Project\Contracts\SearchProviderInterface;
use Modules\Project\Models\Project;
use Modules\User\Enums\UserPermission;
use Modules\User\Models\User;
use Throwable;

class UserSearchProvider implements SearchProviderInterface
{
    public function search(string $query, User $user, int $perGroup): array
    {
        $term = trim($query);

        if (mb_strlen($term) < 2) {
            return [];
        }

        $like = '%'.$this->escapeLike($term).'%';

        return [
            'users' => $this->searchUsers($user, $like, $perGroup),
        ];
    }

    private function searchUsers(User $user, string $like, int $perGroup): array
    {
        $canViewAll = $user->is_admin || $this->canGlobally($user, UserPermission::USERS_VIEW->value);

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
