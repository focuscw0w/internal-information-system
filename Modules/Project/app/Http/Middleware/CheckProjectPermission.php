<?php


namespace Modules\Project\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
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

        $projectId = $request->route('id');
        $project = Project::findOrFail($projectId);

        foreach ($permissions as $permission) {
            if (!$project->userHasPermission($user, $permission)) {
                abort(403, "You don't have this permission: {$permission}");
            }
        }

        return $next($request);
    }
}
