<?php

namespace Modules\Project\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\Project\Models\Project;
use Modules\User\Models\User;

interface ProjectServiceInterface
{
    /**
     * Get all projects with optional filters
     */
    public function getAllProjects(array $filters = []): Collection;

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

    /**
     * Get summary of user's projects
     */
    public function getUserProjectsSummary(User $user): array;
}
