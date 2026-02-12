<?php

namespace Modules\Project\App\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Project\App\Contracts\ProjectServiceInterface;
use Modules\Project\App\Models\Project;
use Illuminate\Support\Facades\Log;

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

        if (isset($filters['search'])) {
            $query->where('name', 'like', '%'.$filters['search'].'%');
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

        if (isset($filters['search'])) {
            $query->where('name', 'like', '%'.$filters['search'].'%');
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
        $projectData = [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? 'planning',
            'workload' => $data['workload'] ?? 'medium',
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'budget' => $data['budget'] ?? null,
            'owner_id' => $data['owner_id'] ?? auth()->id(),
        ];

        $project = Project::create($projectData);

        if (! empty($data['team_members'])) {
            foreach ($data['team_members'] as $member) {
                $project->addTeamMember(
                    $member['user_id'],
                    $member['allocation'] ?? 100
                );
            }
        }

        return $project->fresh(['owner', 'team']);
    }

    /**
     * Update project
     */
    public function updateProject(int $id, array $data): ?Project
    {
        $project = Project::find($id);

        if (! $project) {
            return null;
        }

        Log::info('UpdateProject data:', $data);

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

            Log::info('Team members:', [
                'exists' => array_key_exists('team_members', $data),
                'value' => $data['team_members'] ?? 'not set',
                'team_settings' => $data['team_settings'] ?? 'not set',
            ]);

            // Sync team members
            if (array_key_exists('team_members', $data)) {
                if (is_array($data['team_members']) && ! empty($data['team_members'])) {
                    $syncData = [];

                    foreach ($data['team_members'] as $userId) {
                        $settings = $data['team_settings'][$userId] ?? [];

                        $syncData[$userId] = [
                            'permissions' => json_encode($settings['permissions'] ?? ['view_project']),
                            'allocation' => $settings['allocation'] ?? 100,
                        ];
                    }

                    $project->team()->sync($syncData);
                } else {
                    $project->team()->sync([]);
                }
            }

            DB::commit();

            return $project->fresh(['owner', 'team', 'tasks']);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Project update failed: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Delete project
     */
    public function deleteProject(int $id): bool
    {
        $project = $this->getProjectById($id);

        if (! $project) {
            return false;
        }

        return $project->delete();
    }

    /**
     * Get project statistics
     */
    public function getProjectStatistics(): array
    {
        return [
            'active_projects' => Project::active()->count(),
            'total_team_members' => Project::active()
                ->with('team')
                ->get()
                ->pluck('team')
                ->flatten()
                ->unique('id')
                ->count(),
            'average_capacity' => Project::active()->avg('capacity_used'),
            'completed_tasks' => Project::active()->sum('tasks_completed'),
            'total_tasks' => Project::active()->sum('tasks_total'),
        ];
    }

    /**
     * Add team member to project
     */
    public function addTeamMember(int $projectId, int $userId, string $role, int $allocation = 100): bool
    {
        $project = Project::find($projectId);

        if (! $project) {
            return false;
        }

        $project->addTeamMember($userId, $role, $allocation);

        return true;
    }

    /**
     * Remove team member from project
     */
    public function removeTeamMember(int $projectId, int $userId): bool
    {
        $project = Project::find($projectId);

        if (! $project) {
            return false;
        }

        $project->removeTeamMember($userId);

        return true;
    }

    /**
     * Update project progress based on tasks
     */
    public function updateProjectProgress(int $projectId): ?Project
    {
        $project = Project::find($projectId);

        if (! $project) {
            return null;
        }

        $project->updateProgress();

        return $project;
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
}
