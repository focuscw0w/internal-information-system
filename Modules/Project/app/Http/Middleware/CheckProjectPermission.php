<?php

class CheckProjectPermission
{
    public function handle($request, Closure $next, string $permission)
    {
        $project = $request->route('Project/Index');
        $user = auth()->user();
        
        if (!$project->userHasPermission($user, $permission)) {
            abort(403, "Nemáte oprávnenie: {$permission}");
        }
        
        return $next($request);
    }
}