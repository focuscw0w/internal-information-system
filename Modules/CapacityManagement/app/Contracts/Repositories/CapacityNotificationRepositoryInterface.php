<?php

namespace Modules\CapacityManagement\Contracts\Repositories;

use Modules\Project\Models\Project;
use Modules\User\Models\User;

interface CapacityNotificationRepositoryInterface
{
    public function findUser(int $userId): ?User;

    public function findProject(int $projectId): ?Project;
}
