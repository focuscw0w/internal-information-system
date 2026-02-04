<?php

namespace Modules\Project\App\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Modules\Projekt\Entities\Project;

interface ProjectServiceInterface
{
    public function getAllProjects(array $filters = []): Collection;

    public function getPaginatedProjects(int $perPage = 15, array $filters = []): LengthAwarePaginator;

    public function getProjectById(int $id): ?Project;

    public function createProject(array $data): Project;

    public function updateProject(int $id, array $data): ?Project;

    public function deleteProject(int $id): bool;

    public function getProjectStatistics(): array;

    public function addTeamMember(int $projectId, int $userId, string $role, int $allocation = 100): bool;

    public function removeTeamMember(int $projectId, int $userId): bool;

    public function updateProjectProgress(int $projectId): ?Project;

    public function getProjectsByStatus(string $status): Collection;

    public function getOverdueProjects(): Collection;
}
