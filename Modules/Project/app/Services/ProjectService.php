<?php

namespace Modules\Project\App\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Project\App\Contracts\ProjectServiceInterface;
use Modules\Project\App\Models\Project;

class ProjectService implements ProjectServiceInterface
{
    /**
     * Get all projects with optional filters
     */
    public function getAllProjects(array $filters = []): Collection
    {
        $query = Project::with(['owner', 'team']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['workload'])) {
            $query->where('workload', $filters['workload']);
        }

        if (isset($filters['owner_id'])) {
            $query->where('owner_id', $filters['owner_id']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%'.$filters['search'].'%')
                  ->orWhere('description', 'like', '%'.$filters['search'].'%');
            });
        }

        return $query->get();
    }

    /**
     * Get paginated projects
     */
    public function getPaginatedProjects(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = Project::with(['owner', 'team']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['workload'])) {
            $query->where('workload', $filters['workload']);
        }

        if (isset($filters['owner_id'])) {
            $query->where('owner_id', $filters['owner_id']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%'.$filters['search'].'%')
                  ->orWhere('description', 'like', '%'.$filters['search'].'%');
            });
        }

        return $query->paginate($perPage);
    }

    /**
     * Get project by ID
     */
    public function getProjectById(int $id): ?Project
    {
        return Project::with(['owner', 'team', 'tasks'])->find($id);
    }

    /**
     * Create new project
     */
    public function createProject(array $data): Project
    {
        Log::info('Creating project with data:', $data);

        try {
            DB::beginTransaction();

            $project = Project::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'status' => $data['status'] ?? 'planning',
                'workload' => $data['workload'] ?? 'medium',
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'budget' => $data['budget'] ?? null,
                'owner_id' => auth()->id(),
                'progress' => 0,
                'tasks_total' => 0,
                'tasks_completed' => 0,
                'capacity_used' => 0,
                'capacity_available' => 100,
                'budget_spent' => 0,
            ]);

            // Attach team members if provided
            if (isset($data['team_members']) && is_array($data['team_members']) && !empty($data['team_members'])) {
                $this->syncTeamMembers($project, $data['team_members'], $data['team_settings'] ?? []);
            }

            DB::commit();

            return $project->fresh(['owner', 'team', 'tasks']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Project creation failed: '.$e->getMessage(), [
                'data' => $data,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Update project
     */
    public function updateProject(int $id, array $data): ?Project
    {
        $project = Project::find($id);

        if (!$project) {
            return null;
        }

        Log::info('Updating project:', ['id' => $id, 'data' => $data]);

        try {
            DB::beginTransaction();

            // Update basic project fields
            $project->update([
                'name' => $data['name'] ?? $project->name,
                'description' => $data['description'] ?? $project->description,
                'status' => $data['status'] ?? $project->status,
                'workload' => $data['workload'] ?? $project->workload,
                'start_date' => $data['start_date'] ?? $project->start_date,
                'end_date' => $data['end_date'] ?? $project->end_date,
                'budget' => $data['budget'] ?? $project->budget,
                'progress' => $data['progress'] ?? $project->progress,
            ]);

            // Sync team members if provided
            if (array_key_exists('team_members', $data)) {
                if (is_array($data['team_members']) && !empty($data['team_members'])) {
                    $this->syncTeamMembers($project, $data['team_members'], $data['team_settings'] ?? []);
                } else {
                    Log::info('Removing all team members from project', ['project_id' => $id]);
                    $project->team()->sync([]);
                }
            }

            DB::commit();

            return $project->fresh(['owner', 'team', 'tasks']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Project update failed: '.$e->getMessage(), [
                'project_id' => $id,
                'data' => $data,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete project
     */
    public function deleteProject(int $id): bool
    {
        $project = $this->getProjectById($id);

        if (!$project) {
            return false;
        }

        Log::info('Deleting project', ['project_id' => $id]);

        return $project->delete();
    }

    /**
     * Get project statistics
     */
    public function getProjectStatistics(): array
    {
        return [
            'total' => Project::count(),
            'active' => Project::where('status', 'active')->count(),
            'planning' => Project::where('status', 'planning')->count(),
            'completed' => Project::where('status', 'completed')->count(),
            'on_hold' => Project::where('status', 'on_hold')->count(),
            'cancelled' => Project::where('status', 'cancelled')->count(),
            'overdue' => $this->getOverdueProjects()->count(),
            'total_team_members' => Project::active()
                ->with('team')
                ->get()
                ->pluck('team')
                ->flatten()
                ->unique('id')
                ->count(),
            'average_capacity' => round(Project::active()->avg('capacity_used') ?? 0, 2),
            'completed_tasks' => Project::active()->sum('tasks_completed'),
            'total_tasks' => Project::active()->sum('tasks_total'),
        ];
    }

    /**
     * Update project progress based on tasks
     */
    public function updateProjectProgress(int $projectId): ?Project
    {
        $project = Project::find($projectId);

        if (!$project) {
            return null;
        }

        $project->updateProgress();

        return $project->fresh(['owner', 'team', 'tasks']);
    }

    /**
     * Get projects by status
     */
    public function getProjectsByStatus(string $status): Collection
    {
        return Project::where('status', $status)
            ->with(['owner', 'team'])
            ->get();
    }

    /**
     * Get overdue projects
     */
    public function getOverdueProjects(): Collection
    {
        return Project::where('end_date', '<', now())
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->with(['owner', 'team'])
            ->get();
    }

    // ===== Team Management Methods =====

    /**
     * Update project team (bulk update)
     */
    public function updateProjectTeam(int $id, array $data): ?Project
    {
        $project = Project::find($id);

        if (!$project) {
            return null;
        }

        Log::info('Updating project team:', ['project_id' => $id, 'data' => $data]);

        try {
            DB::beginTransaction();

            if (is_array($data['team_members']) && !empty($data['team_members'])) {
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

        if (!$project) {
            return null;
        }

        // Check if user is already in team
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

        if (!$project) {
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

        if (!$project) {
            return null;
        }

        // Check if user is in team
        if (!$project->team()->where('user_id', $userId)->exists()) {
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
     * Sync team members with their settings (protected helper)
     *
     * @param Project $project
     * @param array $userIds
     * @param array $settings
     * @return void
     */
    protected function syncTeamMembers(Project $project, array $userIds, array $settings): void
    {
        $syncData = [];

        foreach ($userIds as $userId) {
            $userSettings = $settings[$userId] ?? [];

            $syncData[$userId] = [
                'permissions' => json_encode($userSettings['permissions'] ?? ['view_project']),
                'allocation' => $userSettings['allocation'] ?? 100,
            ];
        }

        Log::info('Syncing team members', [
            'project_id' => $project->id,
            'team_members_count' => count($syncData),
        ]);

        $project->team()->sync($syncData);
    }
}