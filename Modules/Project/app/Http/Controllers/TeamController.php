<?php

namespace Modules\Project\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\Project\Contracts\TeamServiceInterface;
use Modules\Project\Http\Requests\Project\UpdateProjectTeamRequest;

class TeamController extends Controller
{
    public function __construct(
        protected TeamServiceInterface $teamService
    ) {}

    /**
     * Update project team
     */
    public function updateTeam(UpdateProjectTeamRequest $request, int $teamId): RedirectResponse
    {
        $project = $this->teamService->updateProjectTeam($teamId, $request->validated());

        if (! $project) {
            return redirect()->back()->with('error', 'Project team was not updated.');
        }

        return redirect()->back()->with('success', 'Team was successfully updated.');
    }

    /**
     * Remove a member from the project team.
     */
    public function removeTeamMember(int $projectId, int $userId): RedirectResponse {
        $isDeleted = $this->teamService->removeMember($projectId, $userId);
        if (! $isDeleted) {
            return back()->with('error', 'Project team was not deleted.');
        }

        return back()->with('success', 'Member was successfully removed.');
    }
}
