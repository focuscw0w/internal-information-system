<?php

namespace Modules\Project\Policies;

use App\Models\User;
use Modules\Project\Models\Project;

class ProjectPolicy
{
    public function update(User $user, Project $project): bool
    {
        return $project->userHasPermission($user, 'edit_project');
    }

    public function delete(User $user, Project $project): bool
    {
        return $project->userHasPermission($user, 'delete_project');
    }

    public function manageTeam(User $user, Project $project): bool
    {
        return $project->userHasPermission($user, 'manage_team');
    }
}
