<?php

namespace Modules\Project\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Project\Contracts\TeamServiceInterface;
use Modules\Project\Http\Requests\UpdateProjectTeamRequest;

class TeamController extends Controller
{
    public function __construct(
        protected TeamServiceInterface $teamService
    ) {}

    /**
     * Update project team
     */
    public function updateTeam(UpdateProjectTeamRequest $request, $id)
    {
        $project = $this->teamService->updateProjectTeam($id, $request->validated());

        if (! $project) {
            return redirect()->back()->with('error', 'Project team was not updated.');
        }

        return redirect()->back()->with('success', 'Team was successfully updated.');
    }
}
