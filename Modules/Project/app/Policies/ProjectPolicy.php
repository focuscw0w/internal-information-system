<?php

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

    public function viewBudget(User $user, Project $project): bool
    {
        return $project->userHasPermission($user, 'view_budget');
    }
}
