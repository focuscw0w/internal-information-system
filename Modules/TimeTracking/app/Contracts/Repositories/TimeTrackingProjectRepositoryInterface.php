<?php

namespace Modules\TimeTracking\Contracts\Repositories;

use Illuminate\Support\Collection;
use Modules\Project\Models\Project;
use Modules\User\Models\User;

interface TimeTrackingProjectRepositoryInterface
{
    public function find(int $id): ?Project;

    public function findOrFail(int $id): Project;

    public function userIsParticipant(int $projectId, User $user): bool;

    public function timerProjectsForUser(int $userId): Collection;

    public function manageableProjectIds(User $user): array;

    public function hasManageableProjects(User $user): bool;

    public function reportFilterProjects(?array $projectIds): Collection;
}
