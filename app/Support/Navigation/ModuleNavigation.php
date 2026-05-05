<?php

namespace App\Support\Navigation;

use App\Enums\PermissionEnum;
use Modules\Project\Models\Project;
use Nwidart\Modules\Facades\Module;
use Throwable;

class ModuleNavigation
{
    public static function build(): array
    {
        $groups = [];
        $user = auth()->user();

        foreach (Module::allEnabled() as $m) {
            $name = $m->getName();
            $path = base_path("Modules/{$name}/config/navigation.php");

            if (! is_file($path)) {
                continue;
            }

            $nav = require $path;

            $groupTitle = $nav['group'] ?? 'Ostatné';
            $items = $nav['items'] ?? [];

            foreach ($items as $item) {
                $requiredPermission = $item['permission'] ?? null;
                $adminOnly = $item['admin_only'] ?? false;
                $managerArea = $item['manager_area'] ?? false;

                if ($adminOnly && (! $user || ! $user->is_admin)) {
                    continue;
                }

                if ($requiredPermission && (! $user || (! $user->is_admin && ! $user->can($requiredPermission)))) {
                    continue;
                }

                if ($managerArea && (! $user || ! self::canAccessManagerArea($user))) {
                    continue;
                }

                if (! empty($item['route'])) {
                    $item['href'] = route($item['route']);
                }

                $item['order'] = $item['order'] ?? 999;

                $groups[$groupTitle]['title'] = $groupTitle;
                $groups[$groupTitle]['items'][] = $item;
            }
        }

        foreach ($groups as &$g) {
            usort($g['items'], fn ($a, $b) => ($a['order'] ?? 999) <=> ($b['order'] ?? 999));
        }

        return array_values($groups);
    }

    private static function canAccessManagerArea($user): bool
    {
        return $user->is_admin
            || self::hasGlobalPermission($user, PermissionEnum::CAPACITY_MANAGE->value)
            || Project::managedBy($user)->exists()
            || Project::whereUserCanManageTimeEntries($user)->exists()
            || Project::query()->whereHas('team', function ($query) use ($user) {
                $query
                    ->where('user_id', $user->id)
                    ->whereJsonContains('permissions', 'view_all_time_entries');
            })->exists();
    }

    private static function hasGlobalPermission($user, string $permission): bool
    {
        try {
            return $user->can($permission);
        } catch (Throwable) {
            return false;
        }
    }
}
