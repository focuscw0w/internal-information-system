<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Modules\Project\Enums\ProjectPermission;
use Modules\Project\Models\Project;
use Modules\User\Models\User;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'current_user_permissions' => fn () => $this->currentUserPermissions($request->user()),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'notifications' => [
                'unread_count' => fn () => $request->user()?->unreadNotifications()->count() ?? 0,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
            ],
        ];
    }

    private function currentUserPermissions(?User $user): array
    {
        if (! $user) {
            return [];
        }

        $permissions = $user->getAllPermissions()->pluck('name')->all();

        $projectPermissions = Project::query()
            ->whereHas('team', fn ($query) => $query->where('user_id', $user->id))
            ->get()
            ->flatMap(fn (Project $project) => $project->userPermissions($user))
            ->all();

        if (Project::query()->where('owner_id', $user->id)->exists()) {
            $projectPermissions = array_merge($projectPermissions, ProjectPermission::allValues());
        }

        return array_values(array_unique(array_merge($permissions, $projectPermissions)));
    }
}
