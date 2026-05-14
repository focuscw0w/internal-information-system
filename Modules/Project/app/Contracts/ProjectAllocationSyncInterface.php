<?php

namespace Modules\Project\Contracts;

use Modules\Project\Models\Project;

interface ProjectAllocationSyncInterface
{
    public function syncCurrentTeamAllocations(Project $project): void;

    public function syncAllocationsForUserProjects(int $userId): int;

    public function syncAllProjectAllocations(): int;

    public function removeAllocationsForUsers(Project $project, array $userIds): void;

    public function syncUsedHoursForProjectUser(int $projectId, int $userId): void;
}
