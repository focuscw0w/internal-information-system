<?php

namespace Modules\Project\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Modules\Project\App\Contracts\ProjectServiceInterface;
use Modules\Project\Models\Project;

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
        $project = Project::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? 'planning',
            'workload' => $data['workload'] ?? 'medium',
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'budget' => $data['budget'] ?? null,
            'owner_id' => $data['owner_id'] ?? auth()->id(),
            'client_id' => $data['client_id'] ?? null,
        ]);

        // Add team members if provided
        if (isset($data['team_members']) && is_array($data['team_members'])) {
            foreach ($data['team_members'] as $member) {
                $project->addTeamMember(
                    $member['user_id'],
                    $member['role'],
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

        return $project->fresh(['owner', 'team']);
    }

    /**
     * Delete project
     */
    public function deleteProject(int $id): bool
    {
        $project = Project::find($id);

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
