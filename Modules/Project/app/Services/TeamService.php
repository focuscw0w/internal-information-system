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
     * Remove a user from the project team.
     */
    public function removeMember(int $projectId, int $userId): bool
    {
        $project = Project::findOrFail($projectId);

        return $project->team()->detach($userId) > 0;
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
                    'permissions' => json_encode($userSettings['permissions'] ?? ['view_project', 'view_tasks']),
                    'allocation' => $userSettings['allocation'] ?? 100,
                ];
            } elseif ($existingMember) {
                $syncData[$userId] = [
                    'permissions' => $existingMember->pivot->permissions,
                    'allocation' => $existingMember->pivot->allocation,
                ];
            } else {
                $syncData[$userId] = [
                    'permissions' => json_encode(['view_project', 'view_tasks']),
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
