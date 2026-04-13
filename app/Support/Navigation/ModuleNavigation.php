<?php

namespace App\Support\Navigation;

use Nwidart\Modules\Facades\Module;

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

                if ($adminOnly && (! $user || ! $user->is_admin)) {
                    continue;
                }

                if ($requiredPermission && (! $user || ! $user->can($requiredPermission))) {
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
}
