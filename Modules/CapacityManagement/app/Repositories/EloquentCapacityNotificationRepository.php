<?php

namespace Modules\CapacityManagement\Repositories;

use Modules\CapacityManagement\Contracts\Repositories\CapacityNotificationRepositoryInterface;
use Modules\Project\Models\Project;
use Modules\User\Models\User;

class EloquentCapacityNotificationRepository implements CapacityNotificationRepositoryInterface
{
    public function findUser(int $userId): ?User
    {
        return User::find($userId);
    }

    public function findProject(int $projectId): ?Project
    {
        return Project::find($projectId);
    }
}
