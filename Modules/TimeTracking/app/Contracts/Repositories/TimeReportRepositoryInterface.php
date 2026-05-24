<?php

namespace Modules\TimeTracking\Contracts\Repositories;

use Carbon\Carbon;
use Illuminate\Support\Collection;

interface TimeReportRepositoryInterface
{
    public function userStats(Carbon $from, Carbon $to, ?array $userIds, ?array $projectIds, string $status): Collection;

    public function projectStats(Carbon $from, Carbon $to, ?array $userIds, ?array $projectIds, string $status): Collection;

    public function topContributors(Carbon $from, Carbon $to, ?array $userIds, ?array $projectIds, string $status): Collection;

    public function timelineEntries(Carbon $from, Carbon $to, ?array $userIds, ?array $projectIds, string $status): Collection;

    public function summaryExportEntries(Carbon $from, Carbon $to, ?array $userIds, ?array $projectIds, string $status): Collection;

    public function detailExportEntries(Carbon $from, Carbon $to, ?array $userIds, ?array $projectIds, string $status): Collection;

    public function usersByIds(array $userIds): Collection;

    public function filterUsers(?array $projectIds): Collection;
}
