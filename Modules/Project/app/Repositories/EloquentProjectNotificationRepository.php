<?php

namespace Modules\Project\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Notifications\DatabaseNotification;
use Modules\Project\Contracts\Repositories\ProjectNotificationRepositoryInterface;
use Modules\User\Models\User;

class EloquentProjectNotificationRepository implements ProjectNotificationRepositoryInterface
{
    public function usersByIds(array $userIds): Collection
    {
        return User::whereIn('id', $userIds)->get();
    }

    public function admins(): Collection
    {
        return User::where('is_admin', true)->get();
    }

    public function recentUnreadExists(User $user, string $type): bool
    {
        return $user->notifications()
            ->where('type', $type)
            ->whereNull('read_at')
            ->where('created_at', '>=', now()->subHours(24))
            ->exists();
    }

    public function recentUnreadMatching(User $user, string $type, callable $matches): bool
    {
        return $user->notifications()
            ->where('type', $type)
            ->whereNull('read_at')
            ->where('created_at', '>=', now()->subHours(24))
            ->get()
            ->contains($matches);
    }

    public function paginateForUser(User $user, int $perPage): LengthAwarePaginator
    {
        return $user->notifications()->paginate($perPage);
    }

    public function findForUser(User $user, string $notificationId): ?DatabaseNotification
    {
        return $user->notifications()->where('id', $notificationId)->first();
    }

    public function markAllAsRead(User $user): int
    {
        $count = $user->unreadNotifications()->count();
        $user->unreadNotifications()->update(['read_at' => now()]);

        return $count;
    }

    public function deleteAll(User $user): int
    {
        $count = $user->notifications()->count();
        $user->notifications()->delete();

        return $count;
    }
}
