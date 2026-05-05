<?php


namespace Modules\Project\Http\Middleware;

use App\Enums\PermissionEnum;
use Closure;
use Illuminate\Http\Request;
use Modules\Project\Enums\ProjectPermission;
use Modules\Project\Models\Project;
use Symfony\Component\HttpFoundation\Response;

class CheckProjectPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'You must be logged in to access this source.');
        }

        $projectId = $request->route('id') ?? $request->route('projectId');
        $project = Project::findOrFail($projectId);

        if ($user->hasPermissionTo(PermissionEnum::PROJECTS_VIEW_ALL->value)
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
