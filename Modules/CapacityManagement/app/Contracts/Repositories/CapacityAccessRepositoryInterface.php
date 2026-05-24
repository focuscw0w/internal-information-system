<?php

namespace Modules\CapacityManagement\Contracts\Repositories;

use Modules\User\Models\User;

interface CapacityAccessRepositoryInterface
{
    public function canAccessManagerArea(User $user): bool;

    public function hasManagedProjects(User $user): bool;

    public function hasTimeEntryManagementProjects(User $user): bool;
}
