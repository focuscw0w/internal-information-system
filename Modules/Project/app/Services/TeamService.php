<?php

namespace Modules\Project\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Modules\Project\Contracts\TeamServiceInterface;
use Modules\Project\Models\Project;

class TeamService implements TeamServiceInterface
{
    /**
     * Update project team (bulk update)
     */
    public function updateProjectTeam(int $id, array $data): ?Project
    {
        $project = Project::find($id);

        if (! $project) {
            Log::warning('Project not found for team update', ['project_id' => $id]);

            return null;
        }

        Log::info('Updating project team:', ['project_id' => $id, 'data' => $data]);

        try {
            DB::beginTransaction();

            if (is_array($data['team_members']) && ! empty($data['team_members'])) {
                $this->syncTeamMembers($project, $data['team_members'], $data['team_settings'] ?? []);
            } else {
                Log::info('Removing all team members from project', ['project_id' => $id]);
                $project->team()->sync([]);
            }

            DB::commit();

            return $project->fresh(['owner', 'team', 'tasks']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Project team update failed: '.$e->getMessage(), [
                'project_id' => $id,
                'data' => $data,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Add single team member to project
     */
    public function addTeamMember(
        int $projectId,
        int $userId,
        array $permissions = ['view_project'],
        int $allocation = 100
    ): ?Project {
        $project = Project::find($projectId);

        if (! $project) {
            Log::warning('Project not found for adding team member', ['project_id' => $projectId]);

            return null;
        }

        if ($project->team()->where('user_id', $userId)->exists()) {
            Log::warning('User already in project team', [
                'project_id' => $projectId,
                'user_id' => $userId,
            ]);

            return $project->fresh(['owner', 'team']);
        }

        try {
            $project->team()->attach($userId, [
                'permissions' => json_encode($permissions),
                'allocation' => $allocation,
            ]);

            Log::info('Added team member to project', [
                'project_id' => $projectId,
                'user_id' => $userId,
                'permissions' => $permissions,
                'allocation' => $allocation,
            ]);

            return $project->fresh(['owner', 'team']);
        } catch (\Exception $e) {
            Log::error('Failed to add team member: '.$e->getMessage(), [
                'project_id' => $projectId,
                'user_id' => $userId,
            ]);
            throw $e;
        }
    }

    /**
     * Remove team member from project
     */
    public function removeTeamMember(int $projectId, int $userId): ?Project
    {
        $project = Project::find($projectId);

        if (! $project) {
            Log::warning('Project not found for removing team member', ['project_id' => $projectId]);

            return null;
        }

        try {
            $project->team()->detach($userId);

            Log::info('Removed team member from project', [
                'project_id' => $projectId,
                'user_id' => $userId,
            ]);

            return $project->fresh(['owner', 'team']);
        } catch (\Exception $e) {
            Log::error('Failed to remove team member: '.$e->getMessage(), [
                'project_id' => $projectId,
                'user_id' => $userId,
            ]);
            throw $e;
        }
    }

    /**
     * Update team member settings
     */
    public function updateTeamMemberSettings(
        int $projectId,
        int $userId,
        ?array $permissions = null,
        ?int $allocation = null
    ): ?Project {
        $project = Project::find($projectId);

        if (! $project) {
            Log::warning('Project not found for updating team member settings', ['project_id' => $projectId]);

            return null;
        }

        if (! $project->team()->where('user_id', $userId)->exists()) {
            Log::warning('User not in project team', [
                'project_id' => $projectId,
                'user_id' => $userId,
            ]);

            return null;
        }

        $updateData = [];

        if ($permissions !== null) {
            $updateData['permissions'] = json_encode($permissions);
        }

        if ($allocation !== null) {
            $updateData['allocation'] = $allocation;
        }

        if (empty($updateData)) {
            Log::warning('No update data provided for team member', [
                'project_id' => $projectId,
                'user_id' => $userId,
            ]);

            return $project->fresh(['owner', 'team']);
        }

        try {
            $project->team()->updateExistingPivot($userId, $updateData);

            Log::info('Updated team member settings', [
                'project_id' => $projectId,
                'user_id' => $userId,
                'updates' => $updateData,
            ]);

            return $project->fresh(['owner', 'team']);
        } catch (\Exception $e) {
            Log::error('Failed to update team member settings: '.$e->getMessage(), [
                'project_id' => $projectId,
                'user_id' => $userId,
                'updates' => $updateData,
            ]);
            throw $e;
        }
    }

    /**
     * Sync team members with their settings 
     */
    public function syncTeamMembers(Project $project, array $userIds, array $settings): void
    {
        $existing = $project->team()
            ->wherePivotIn('user_id', $userIds)
            ->get()
            ->keyBy('id');

        $syncData = [];

        foreach ($userIds as $userId) {
            $userSettings = $settings[$userId] ?? null;
            $existingMember = $existing->get($userId);

            if ($userSettings !== null) {
                $syncData[$userId] = [
                    'permissions' => json_encode($userSettings['permissions'] ?? ['view_project']),
                    'allocation' => $userSettings['allocation'] ?? 100,
                ];
            } elseif ($existingMember) {
                $syncData[$userId] = [
                    'permissions' => $existingMember->pivot->permissions,
                    'allocation' => $existingMember->pivot->allocation,
                ];
            } else {
                $syncData[$userId] = [
                    'permissions' => json_encode(['view_project']),
                    'allocation' => 100,
                ];
            }
        }

        Log::info('Syncing team members', [
            'project_id' => $project->id,
            'team_members_count' => count($syncData),
        ]);

        $project->team()->sync($syncData);
    }
}
