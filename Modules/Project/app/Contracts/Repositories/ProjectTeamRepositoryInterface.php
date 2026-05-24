<?php

namespace Modules\Project\Contracts\Repositories;

use Illuminate\Support\Collection;
use Modules\Project\Models\Project;

interface ProjectTeamRepositoryInterface
{
    public function userIds(Project $project): array;

    public function existingMembers(Project $project, array $userIds): Collection;

    public function sync(Project $project, array $syncData): void;

    public function detach(Project $project, int $userId): int;
}
