<?php

namespace Modules\CapacityManagement\Http\Middleware;

use App\Enums\PermissionEnum;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCapacityManagementAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->is_admin && ! $user?->can(PermissionEnum::CAPACITY_MANAGE->value)) {
            abort(403);
        }

        return $next($request);
    }
}
