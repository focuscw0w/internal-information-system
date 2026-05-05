<?php

namespace App\Http\Middleware;

use App\Enums\PermissionEnum;
use Closure;
use Illuminate\Http\Request;
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
            || $this->hasGlobalPermission($user, PermissionEnum::CAPACITY_MANAGE->value)
            || Project::managedBy($user)->exists()
            || Project::whereUserCanManageTimeEntries($user)->exists()
            || Project::query()->whereHas('team', function ($query) use ($user) {
                $query
                    ->where('user_id', $user->id)
                    ->whereJsonContains('permissions', 'view_all_time_entries');
            })->exists()
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
