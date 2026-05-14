<?php

namespace Modules\CapacityManagement\Contracts;

interface CapacityReaderInterface
{
    /**
     * Get configured weekly capacity hours for a single user, or null if not set.
     */
    public function getWeeklyCapacityForUser(int $userId): ?int;

    /**
     * Get configured weekly capacity hours keyed by user id, for the given users.
     *
     * @param  int[]  $userIds
     * @return array<int, int>
     */
    public function getWeeklyCapacitiesForUsers(array $userIds): array;
}
