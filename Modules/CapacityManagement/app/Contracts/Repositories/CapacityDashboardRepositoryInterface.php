<?php

namespace Modules\CapacityManagement\Contracts\Repositories;

use Illuminate\Support\Collection;
use Modules\User\Models\User;

interface CapacityDashboardRepositoryInterface
{
    public function tasksDueForUser(User $user, string $today, int $limit = 6): Collection;

    public function atRiskProjectsForUser(User $user, int $limit = 5): Collection;

    /**
     * @return array{logged_hours: float, today_hours: float, entries_count: int}
     */
    public function weekTimeEntryStatsForUser(int $userId, string $weekStart, string $today): array;
}
