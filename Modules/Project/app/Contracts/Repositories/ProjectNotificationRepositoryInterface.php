<?php

namespace Modules\Project\Contracts\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Notifications\DatabaseNotification;
use Modules\User\Models\User;

interface ProjectNotificationRepositoryInterface
{
    public function usersByIds(array $userIds): Collection;

    public function admins(): Collection;

    public function recentUnreadExists(User $user, string $type): bool;

    public function recentUnreadMatching(User $user, string $type, callable $matches): bool;

    public function paginateForUser(User $user, int $perPage): LengthAwarePaginator;

    public function findForUser(User $user, string $notificationId): ?DatabaseNotification;

    public function markAllAsRead(User $user): int;

    public function deleteAll(User $user): int;
}
