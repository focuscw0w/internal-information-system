<?php

namespace Modules\CapacityManagement\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\CapacityManagement\Enums\CapacityPermission;
use Symfony\Component\HttpFoundation\Response;

class EnsureCapacityManagementAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->is_admin && ! $user?->can(CapacityPermission::CAPACITY_MANAGE->value)) {
            abort(403);
        }

        return $next($request);
    }
}
