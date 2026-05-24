<?php

namespace Modules\CapacityManagement\Repositories;

use Modules\CapacityManagement\Contracts\Repositories\CapacityAccessRepositoryInterface;
use Modules\CapacityManagement\Enums\CapacityPermission;
use Modules\Project\Models\Project;
use Modules\User\Models\User;
use Throwable;

class EloquentCapacityAccessRepository implements CapacityAccessRepositoryInterface
{
    public function canAccessManagerArea(User $user): bool
    {
        return $user->is_admin
            || $this->canGlobally($user, CapacityPermission::CAPACITY_MANAGE->value)
            || $this->hasManagedProjects($user)
            || $this->hasTimeEntryManagementProjects($user);
    }

    public function hasManagedProjects(User $user): bool
    {
        return Project::managedBy($user)->exists();
    }

    public function hasTimeEntryManagementProjects(User $user): bool
    {
        return Project::whereUserCanManageTimeEntries($user)->exists();
    }

    private function canGlobally(User $user, string $permission): bool
    {
        try {
            return $user->can($permission);
        } catch (Throwable) {
            return false;
        }
    }
}
