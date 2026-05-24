<?php

namespace Modules\CapacityManagement\Services;

use Modules\CapacityManagement\Contracts\CapacityReaderInterface;
use Modules\CapacityManagement\Contracts\Repositories\EmployeeCapacityRepositoryInterface;

class CapacityReader implements CapacityReaderInterface
{
    public function __construct(private readonly EmployeeCapacityRepositoryInterface $employeeCapacities) {}

    public function getWeeklyCapacityForUser(int $userId): ?int
    {
        return $this->employeeCapacities->weeklyCapacityForUser($userId);
    }

    public function getWeeklyCapacitiesForUsers(array $userIds): array
    {
        $userIds = array_values(array_unique(array_map('intval', $userIds)));

        if ($userIds === []) {
            return [];
        }

        return $this->employeeCapacities->weeklyCapacitiesForUsers($userIds);
    }
}
