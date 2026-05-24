<?php

namespace Modules\Project\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Project\Contracts\NotificationServiceInterface;
use Modules\Project\Contracts\ProjectAllocationSyncInterface;
use Modules\Project\Contracts\Repositories\ProjectRepositoryInterface;
use Modules\Project\Contracts\ProjectServiceInterface;
use Modules\Project\Contracts\TeamServiceInterface;
use Modules\Project\Models\Project;
use Modules\Project\Transformers\ProjectSummaryResource;
use Modules\User\Models\User;

class ProjectService implements ProjectServiceInterface
{
    /**
     * Create a new project service instance.
     */
    public function __construct(
        protected TeamServiceInterface $teamService,
        protected NotificationServiceInterface $notificationService,
        protected ProjectAllocationSyncInterface $allocationSyncService,
        protected ProjectRepositoryInterface $projects,
    ) {}

    /**
     * Get all projects with optional filters.
     */
    public function getAllProjects(array $filters = []): Collection
    {
        $user = auth()->user();

        return $this->projects->visibleTo($user, $filters);
    }

    /**
     * Get a project by its identifier.
     */
    public function getProjectById(int $id): ?Project
    {
        $project = $this->projects->findWithDetails($id);

        if (! $project) {
            Log::warning('Project not found', ['project_id' => $id]);
        }

        return $project;
    }

    /**
     * Create a new project.
     */
    public function createProject(array $data): Project
    {
        Log::info('Creating project with data:', $data);

        try {
            DB::beginTransaction();

            $project = $this->projects->create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'status' => $data['status'] ?? 'planning',
                'workload' => $data['workload'] ?? 'medium',
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'owner_id' => auth()->id(),
                'progress' => 0,
                'tasks_total' => 0,
                'tasks_completed' => 0,
                'capacity_used' => 0,
                'capacity_available' => 100,
            ]);

            // Attach team members if provided
            if (isset($data['team_members']) && is_array($data['team_members']) && ! empty($data['team_members'])) {
                $this->teamService->syncTeamMembers($project, $data['team_members'], $data['team_settings'] ?? []);
            }

            DB::commit();

            return $this->projects->fresh($project, ['owner', 'team', 'tasks']);
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
     * Update an existing project.
     */
    public function updateProject(int $id, array $data): ?Project
    {
        $project = $this->projects->find($id);

        if (! $project) {
            Log::warning('Project not found for update', ['project_id' => $id]);

            return null;
        }

        Log::info('Updating project:', ['id' => $id, 'data' => $data]);

        try {
            DB::beginTransaction();

            $oldStatus = $project->status;

            // Update basic project fields
            $this->projects->update($project, [
                'name' => $data['name'] ?? $project->name,
                'description' => $data['description'] ?? $project->description,
                'status' => $data['status'] ?? $project->status,
                'workload' => $data['workload'] ?? $project->workload,
                'start_date' => $data['start_date'] ?? $project->start_date,
                'end_date' => $data['end_date'] ?? $project->end_date,
                'progress' => $data['progress'] ?? $project->progress,
            ]);

            // Sync team members if provided
            if (array_key_exists('team_members', $data)) {
                $this->teamService->syncTeamMembers(
                    $project,
                    is_array($data['team_members']) ? $data['team_members'] : [],
                    $data['team_settings'] ?? [],
                );
            } else {
                $project->load('team');
                $this->allocationSyncService->syncCurrentTeamAllocations($project);
            }

            DB::commit();

            if (isset($data['status']) && $data['status'] !== $oldStatus && auth()->check()) {
                $this->notificationService->notifyProjectStatusChanged(
                    $this->projects->fresh($project, ['owner', 'team']),
                    $oldStatus,
                    $data['status'],
                    auth()->user()
                );
            }

            return $this->projects->fresh($project, ['owner', 'team', 'tasks']);
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
     * Delete a project.
     */
    public function deleteProject(int $id): bool
    {
        $project = $this->getProjectById($id);

        if (! $project) {
            Log::warning('Project not found for deletion', ['project_id' => $id]);

            return false;
        }

        Log::info('Deleting project', ['project_id' => $id]);

        return $this->projects->delete($project);
    }

    /**
     * Get project statistics.
     */
    public function getProjectStatistics(): array
    {
        return $this->projects->statistics();
    }

    /**
     * Update project progress based on tasks.
     */
    public function updateProjectProgress(int $projectId): ?Project
    {
        $project = $this->projects->find($projectId);

        if (! $project) {
            Log::warning('Project not found for progress update', ['project_id' => $projectId]);

            return null;
        }

        $project->updateProgress();

        return $this->projects->fresh($project, ['owner', 'team', 'tasks']);
    }

    /**
     * Get projects by status.
     */
    public function getProjectsByStatus(string $status): Collection
    {
        return $this->projects->byStatus($status);
    }

    /**
     * Get overdue projects.
     */
    public function getOverdueProjects(): Collection
    {
        return $this->projects->overdue();
    }

    /**
     * Get a summary of the user's projects.
     */
    public function getUserProjectsSummary(User $user): array
    {
        $projects = $this->projects->forUserWithSummaryRelations($user->id);

        return ProjectSummaryResource::collectionForUser($projects, $user->id)->toArray();
    }

    /**
     * Get active projects with incomplete tasks for forecasting.
     */
    public function getActiveProjectsWithIncompleteTasks(): Collection
    {
        return $this->projects->activeWithIncompleteTasks();
    }
}
