<?php

namespace Modules\CapacityManagement\Repositories;

use Illuminate\Support\Collection;
use Modules\CapacityManagement\Contracts\Repositories\EmployeeCapacityRepositoryInterface;
use Modules\CapacityManagement\Models\EmployeeCapacity;

class EloquentEmployeeCapacityRepository implements EmployeeCapacityRepositoryInterface
{
    public function updateOrCreateWeeklyCapacity(int $userId, int $hours): void
    {
        EmployeeCapacity::query()->updateOrCreate(
            ['user_id' => $userId],
            ['weekly_capacity_hours' => $hours],
        );
    }

    public function weeklyCapacityForUser(int $userId): ?int
    {
        $value = EmployeeCapacity::query()
            ->where('user_id', $userId)
            ->value('weekly_capacity_hours');

        return $value !== null ? (int) $value : null;
    }

    public function weeklyCapacitiesForUsers(array $userIds): array
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

    public function weeklyCapacityMap(): Collection
    {
        return EmployeeCapacity::query()->pluck('weekly_capacity_hours', 'user_id');
    }
}
