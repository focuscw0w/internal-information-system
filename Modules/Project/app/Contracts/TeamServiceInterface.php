<?php

namespace Modules\Project\Contracts;

use Modules\Project\Models\Project;

interface TeamServiceInterface
{
    public function updateProjectTeam(int $id, array $data): ?Project;

    public function addTeamMember(int $projectId,
        int $userId,
        array $permissions = ['view_project'],
        int $allocation = 100): ?Project;

    public function removeTeamMember(int $projectId, int $userId): ?Project;

    public function updateTeamMemberSettings(
        int $projectId,
        int $userId,
        ?array $permissions = null,
        ?int $allocation = null
    ): ?Project;
}
