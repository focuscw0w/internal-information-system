<?php

namespace Modules\CapacityManagement\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\CapacityManagement\Enums\CapacityPermission;
use Modules\Project\Models\Project;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class EnsureCanAccessManagerArea
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        if (
            $user->is_admin
            || $this->hasGlobalPermission($user, CapacityPermission::CAPACITY_MANAGE->value)
            || Project::managedBy($user)->exists()
            || Project::whereUserCanManageTimeEntries($user)->exists()
        ) {
            return $next($request);
        }

        abort(403);
    }

    private function hasGlobalPermission($user, string $permission): bool
    {
        try {
            return $user->can($permission);
        } catch (Throwable) {
            return false;
        }
    }
}
