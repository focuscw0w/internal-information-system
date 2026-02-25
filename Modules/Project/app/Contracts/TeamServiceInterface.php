<?php

namespace Modules\Project\Contracts;

use Modules\Project\Models\Project;

interface TeamServiceInterface
{
    public function updateProjectTeam(int $id, array $data): ?Project;
}
