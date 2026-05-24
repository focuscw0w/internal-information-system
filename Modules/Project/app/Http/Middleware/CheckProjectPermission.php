<?php


namespace Modules\Project\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Project\Contracts\Repositories\ProjectRepositoryInterface;
use Modules\Project\Enums\ProjectGlobalPermission;
use Modules\Project\Enums\ProjectPermission;
use Symfony\Component\HttpFoundation\Response;

class CheckProjectPermission
{
    public function __construct(private readonly ProjectRepositoryInterface $projects) {}

    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'You must be logged in to access this source.');
        }

        $projectId = $request->route('id') ?? $request->route('projectId');
        $project = $this->projects->findOrFail($projectId);

        if ($user->hasPermissionTo(ProjectGlobalPermission::PROJECTS_VIEW_ALL->value)
            && $this->onlyReadPermissions($permissions)
        ) {
            return $next($request);
        }

        foreach ($permissions as $permission) {
            if (!$project->userHasPermission($user, $permission)) {
                abort(403, "You don't have this permission: {$permission}");
            }
        }

        return $next($request);
    }

    private function onlyReadPermissions(array $permissions): bool
    {
        if ($permissions === []) {
            return false;
        }

        return empty(array_diff($permissions, ProjectPermission::viewPermissions()));
    }
}
