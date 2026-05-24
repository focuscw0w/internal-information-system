<?php

namespace Modules\TimeTracking\Services\Search;

use Modules\Project\Contracts\SearchProviderInterface;
use Modules\Project\Services\Search\SearchActionBuilder;
use Modules\TimeTracking\Contracts\Repositories\TimeTrackingProjectRepositoryInterface;
use Modules\User\Models\User;

class TimeTrackingSearchProvider implements SearchProviderInterface
{
    public function __construct(
        private readonly TimeTrackingProjectRepositoryInterface $timeProjects,
    ) {}

    public function search(string $query, User $user, int $perGroup): array
    {
        $term = trim($query);
        $actions = [];

        if ($user->is_admin || $this->timeProjects->hasManageableProjects($user)) {
            $actions[] = SearchActionBuilder::make(
                'time-approvals',
                'Schvaľovania',
                'Schváliť alebo zamietnuť čakajúce záznamy času',
                '/manager/approvals',
                'clipboard-check',
                ['schvalovanie', 'approval', 'approvals', 'time approvals']
            );

            $actions[] = SearchActionBuilder::make(
                'time-reports',
                'Reporty času',
                'Prehľady a exporty odpracovaného času',
                '/manager/time/reports',
                'bar-chart-3',
                ['report', 'reporty', 'cas', 'time reports']
            );
        }

        if ($actions === []) {
            return [];
        }

        return [
            'actions' => SearchActionBuilder::filterAndShape($actions, $term, $perGroup),
        ];
    }
}
