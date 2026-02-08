<?php

class CheckProjectPermission
{
     /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json([
                'error' => 'Unauthenticated',
                'message' => 'Musíte byť prihlásený'
            ], 401);
        }
        
        $project = $request->route('project');
        
        if (!$project || !($project instanceof Project)) {
            return response()->json([
                'error' => 'Project not found',
                'message' => 'Projekt neexistuje'
            ], 404);
        }
        
        if (!$project->userHasPermission($user, $permission)) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => "Nemáte oprávnenie: {$permission}",
                'required_permission' => $permission
            ], 403);
        }
        
        return $next($request);
    }
}