<?php

namespace Modules\CapacityManagement\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\CapacityManagement\Contracts\Repositories\CapacityAccessRepositoryInterface;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanAccessManagerArea
{
    public function __construct(
        private readonly CapacityAccessRepositoryInterface $accessRepository,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        if ($this->accessRepository->canAccessManagerArea($user)) {
            return $next($request);
        }

        abort(403);
    }
}
