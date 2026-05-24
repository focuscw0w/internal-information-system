<?php

namespace Modules\CapacityManagement\Contracts\Repositories;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\User\Models\User;

interface ManagerDashboardRepositoryInterface
{
    public function pendingApprovalCount(?array $projectIds = null): int;

    public function pendingApprovalEntries(?array $projectIds = null, int $limit = 8): Collection;

    public function overdueTasks(?array $projectIds = null, int $limit = 6): Collection;

    public function atRiskProjects(?array $projectIds = null, int $limit = 6): Collection;

    public function managedProjects(?array $projectIds = null, int $limit = 8): Collection;

    public function teamProjects(User $user, bool $includeAll): Collection;

    public function managedProjectIds(User $user, bool $isAdmin): Collection;

    public function managedTimeProjectIds(User $user, bool $isAdmin): Collection;

    public function viewTimeProjectIds(User $user, bool $isAdmin): Collection;

    public function allUserIds(): Collection;

    public function usersByIds(array $userIds): Collection;

    public function projectHoursByProjectAndUser(array $projectIds, Carbon $from, Carbon $to): Collection;
}
