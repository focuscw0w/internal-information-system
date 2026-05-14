<?php

namespace Modules\CapacityManagement\Services;

use Modules\CapacityManagement\Contracts\CapacityReaderInterface;
use Modules\CapacityManagement\Models\EmployeeCapacity;

class CapacityReader implements CapacityReaderInterface
{
    public function getWeeklyCapacityForUser(int $userId): ?int
    {
        $value = EmployeeCapacity::query()
            ->where('user_id', $userId)
            ->value('weekly_capacity_hours');

        return $value !== null ? (int) $value : null;
    }

    public function getWeeklyCapacitiesForUsers(array $userIds): array
    {
        $userIds = array_values(array_unique(array_map('intval', $userIds)));

        if ($userIds === []) {
            return [];
        }

        return EmployeeCapacity::query()
            ->whereIn('user_id', $userIds)
            ->pluck('weekly_capacity_hours', 'user_id')
            ->map(fn ($hours) => (int) $hours)
            ->all();
    }
}
