<?php

namespace Modules\User\Http\Middleware;

use App\Enums\PermissionEnum;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserManagementAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->can(PermissionEnum::USERS_MANAGE->value)) {
            abort(403);
        }

        return $next($request);
    }
}
