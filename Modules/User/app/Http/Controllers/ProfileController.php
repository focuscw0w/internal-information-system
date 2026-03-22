<?php

namespace Modules\User\Http\Controllers;

use App\Enums\PermissionEnum;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Project\Contracts\ProjectServiceInterface;
use Modules\TimeTracking\Contracts\TimeEntryServiceInterface;
use Modules\User\Models\User;

class ProfileController extends Controller
{
    public function __construct(
        private readonly ProjectServiceInterface $projectService,
        private readonly TimeEntryServiceInterface $timeEntryService,
    ) {}

    /**
     * Show the authenticated user's profile.
     */
    public function me(): Response
    {
        return $this->renderProfile(Auth::user());
    }

    /**
     * Show another user's profile. Access may be restricted based on permissions.
     */
    public function show(User $user): Response
    {
        return $this->renderProfile($user);
    }

    /**
     * Render the profile page with user details, permissions, projects, and time tracking summary.
     */
    private function renderProfile(User $user): Response
    {
        return Inertia::render('User/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at,
            ],
            'isOwnProfile' => Auth::id() === $user->id,
            'permissions' => $this->getUserPermissions($user),
            'projects' => $this->projectService->getUserProjectsSummary($user),
            'timeTracking' => $this->timeEntryService->getUserSummary($user),
        ]);
    }

    /**
     * Get the user's permissions in a format suitable for frontend display.
     */
    private function getUserPermissions(User $user): array
    {
        $userPermissions = $user->getPermissionNames()->toArray();

        return collect(PermissionEnum::cases())
            ->filter(fn ($perm) => in_array($perm->value, $userPermissions))
            ->map(fn ($perm) => [
                'value' => $perm->value,
                'label' => $perm->label(),
            ])
            ->values()
            ->toArray();
    }
}
