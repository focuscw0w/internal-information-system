<?php

namespace Modules\TimeTracking\Contracts\Repositories;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\TimeTracking\Models\TimeEntry;
use Modules\User\Models\User;

interface TimeEntryRepositoryInterface
{
    public function getByProject(int $projectId, array $filters = []): Collection;

    public function getByTask(int $taskId): Collection;

    public function create(array $data): TimeEntry;

    public function find(int $id): ?TimeEntry;

    public function findOrFail(int $id): TimeEntry;

    public function findWithProjectOrFail(int $id): TimeEntry;

    public function findManyWithProject(array $ids): Collection;

    public function update(TimeEntry $entry, array $data): bool;

    public function delete(TimeEntry $entry): bool;

    public function updateStatusForIds(array $ids, array $data): int;

    public function totalHoursForTask(int $taskId): float;

    public function totalHoursPerUserInPeriod(
        Carbon $from,
        Carbon $to,
        ?array $userIds = null,
        ?array $projectIds = null,
        string $status = 'all',
    ): Collection;

    public function totalHoursPerProjectInPeriod(
        Carbon $from,
        Carbon $to,
        ?array $userIds = null,
        ?array $projectIds = null,
        string $status = 'approved',
    ): Collection;

    public function hoursGroupedByWeekAndUser(
        Carbon $from,
        Carbon $to,
        ?array $userIds = null,
        ?array $projectIds = null,
        string $status = 'all',
    ): array;

    public function entriesForUser(User $user): Collection;

    public function totalHoursThisWeekForUser(User $user): float;

    public function totalHoursThisMonthForUser(User $user): float;

    public function recentEntriesForUser(User $user, int $limit = 5): Collection;
}
