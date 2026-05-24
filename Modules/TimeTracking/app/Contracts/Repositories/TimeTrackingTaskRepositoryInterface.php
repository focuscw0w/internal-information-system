<?php

namespace Modules\TimeTracking\Contracts\Repositories;

use Modules\Project\Models\Task;

interface TimeTrackingTaskRepositoryInterface
{
    public function find(int $id): ?Task;

    public function assignedUserExists(int $taskId, int $userId): bool;

    public function updateActualHours(int $taskId, float $hours): void;

    public function findForHoursExceededCheck(int $taskId): ?Task;
}
