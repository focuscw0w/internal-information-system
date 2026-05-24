<?php

namespace Modules\CapacityManagement\Contracts\Repositories;

use Illuminate\Database\Eloquent\Collection;

interface CapacityForecastRepositoryInterface
{
    /**
     * @param  iterable<int>  $projectIds
     */
    public function allocationsForProjects(iterable $projectIds): Collection;

    public function allocationsForProject(int $projectId): Collection;
}
