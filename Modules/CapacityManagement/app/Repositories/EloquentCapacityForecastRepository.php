<?php

namespace Modules\CapacityManagement\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\CapacityManagement\Contracts\Repositories\CapacityForecastRepositoryInterface;
use Modules\Project\Models\ProjectAllocation;

class EloquentCapacityForecastRepository implements CapacityForecastRepositoryInterface
{
    public function allocationsForProjects(iterable $projectIds): Collection
    {
        $ids = collect($projectIds)
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($ids === []) {
            return new Collection();
        }

        return ProjectAllocation::query()
            ->whereIn('project_id', $ids)
            ->get();
    }

    public function allocationsForProject(int $projectId): Collection
    {
        return ProjectAllocation::forProject($projectId)->get();
    }
}
