<?php

namespace Modules\CapacityManagement\DTO;

use Carbon\Carbon;
use Illuminate\Support\Collection;

class CapacityInputs
{
    /**
     * @param  Collection                   $users              User objects (id, name, email)
     * @param  array<int,int>               $capacitiesMap      user_id → weekly_capacity_hours
     * @param  array<int,float>             $weeklyByUser       user_id → hours this week
     * @param  array<int,float>             $monthlyByUser      user_id → hours this month
     * @param  int                          $weeksInMonth
     * @param  array<string,Carbon>         $periods            start_of_week / end_of_week / start_of_month / end_of_month
     * @param  Collection                   $activeProjects     Project models with tasks eager-loaded
     * @param  array<string,array<int,float>> $historyByYwAndUser  [ISO-year-week][user_id] = hours
     * @param  Carbon                       $now                Injectable reference time (allows frozen tests)
     */
    public function __construct(
        public readonly Collection $users,
        public readonly array $capacitiesMap,
        public readonly array $weeklyByUser,
        public readonly array $monthlyByUser,
        public readonly int $weeksInMonth,
        public readonly array $periods,
        public readonly Collection $activeProjects,
        public readonly array $historyByYwAndUser,
        public readonly Carbon $now,
    ) {}
}
