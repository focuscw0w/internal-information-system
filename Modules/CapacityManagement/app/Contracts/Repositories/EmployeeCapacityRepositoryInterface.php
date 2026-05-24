<?php

namespace Modules\CapacityManagement\Contracts\Repositories;

use Illuminate\Support\Collection;

interface EmployeeCapacityRepositoryInterface
{
    public function updateOrCreateWeeklyCapacity(int $userId, int $hours): void;

    public function weeklyCapacityForUser(int $userId): ?int;

    /**
     * @param  int[]  $userIds
     * @return array<int, int>
     */
    public function weeklyCapacitiesForUsers(array $userIds): array;

    /**
     * @return Collection<int, int>
     */
    public function weeklyCapacityMap(): Collection;
}
