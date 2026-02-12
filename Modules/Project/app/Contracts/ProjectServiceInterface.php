<?php

namespace Modules\Project\App\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Project\App\Models\Project;

interface ProjectServiceInterface
{
    /**
     * Get all projects with optional filters
     */
    public function getAllProjects(array $filters = []): Collection;

    /**
     * Get paginated projects with optional filters
     */
    public function getPaginatedProjects(int $perPage = 15, array $filters = []): LengthAwarePaginator;

    /**
     * Get project by ID
     */
    public function getProjectById(int $id): ?Project;

    /**
     * Create new project
     */
    public function createProject(array $data): Project;

    /**
     * Update existing project
     */
    public function updateProject(int $id, array $data): ?Project;

    /**
     * Delete project
     */
    public function deleteProject(int $id): bool;

    /**
     * Get project statistics
     */
    public function getProjectStatistics(): array;

    /**
     * Update project progress based on tasks
     */
    public function updateProjectProgress(int $projectId): ?Project;

    /**
     * Get projects by status
     */
    public function getProjectsByStatus(string $status): Collection;

    /**
     * Get overdue projects
     */
    public function getOverdueProjects(): Collection;

    // ===== Team Management Methods =====

    /**
     * Update project team (bulk update)
     */
    public function updateProjectTeam(int $id, array $data): ?Project;

    /**
     * Add single team member to project
     */
    public function addTeamMember(
        int $projectId, 
        int $userId, 
        array $permissions = ['view_project'], 
        int $allocation = 100
    ): ?Project;

    /**
     * Remove single team member from project
     */
    public function removeTeamMember(int $projectId, int $userId): ?Project;

    /**
     * Update team member settings (permissions and/or allocation)
     */
    public function updateTeamMemberSettings(
        int $projectId, 
        int $userId, 
        ?array $permissions = null, 
        ?int $allocation = null
    ): ?Project;
}