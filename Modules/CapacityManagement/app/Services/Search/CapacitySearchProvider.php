<?php

namespace Modules\CapacityManagement\Services\Search;

use Modules\CapacityManagement\Enums\CapacityPermission;
use Modules\Project\Contracts\SearchProviderInterface;
use Modules\Project\Models\Project;
use Modules\Project\Services\Search\SearchActionBuilder;
use Modules\User\Models\User;
use Throwable;

class CapacitySearchProvider implements SearchProviderInterface
{
    public function search(string $query, User $user, int $perGroup): array
    {
        $term = trim($query);
        $actions = [];

        if ($this->canAccessManagerArea($user)) {
            $actions[] = SearchActionBuilder::make(
                'manager-dashboard',
                'Tímové riadenie',
                'Prehľad schvaľovaní, rizík, kapacít a tímovej práce',
                '/manager',
                'layout-dashboard',
                ['manager', 'timove riadenie', 'dashboard']
            );
        }

        if ($user->is_admin || $this->canGlobally($user, CapacityPermission::CAPACITY_MANAGE->value)) {
            $actions[] = SearchActionBuilder::make(
                'capacity-management',
                'Kapacity',
                'Správa týždenných kapacít a vyťaženia tímu',
                '/capacity-management',
                'activity',
                ['kapacity', 'capacity', 'vytazenie']
            );
        }

        if ($actions === []) {
            return [];
        }

        return [
            'actions' => SearchActionBuilder::filterAndShape($actions, $term, $perGroup),
        ];
    }

    private function canAccessManagerArea(User $user): bool
    {
        return $user->is_admin
            || $this->canGlobally($user, CapacityPermission::CAPACITY_MANAGE->value)
            || Project::managedBy($user)->exists()
            || Project::whereUserCanManageTimeEntries($user)->exists();
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
