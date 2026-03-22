<?php

namespace Modules\User\Http\Controllers;

use App\Enums\PermissionEnum;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Project\Contracts\ProjectServiceInterface;
use Modules\TimeTracking\Contracts\TimeEntryServiceInterface;

class ProfileController extends Controller
{
    public function __construct(
        private readonly ProjectServiceInterface $projectService,
        private readonly TimeEntryServiceInterface $timeEntryService,
    ) {}

    public function __invoke(): Response
    {
        $user = Auth::user();

        return Inertia::render('User/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at,
            ],
            'permissions' => $this->getUserPermissions($user),
            'projects' => $this->projectService->getUserProjectsSummary($user),
            'timeTracking' => $this->timeEntryService->getUserSummary($user),
        ]);
    }
    
    private function getUserPermissions($user): array
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
