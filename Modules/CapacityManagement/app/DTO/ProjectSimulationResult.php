<?php

namespace Modules\CapacityManagement\DTO;

class ProjectSimulationResult
{
    /**
     * @param array<int, array{week_label: string, ideal_remaining: float, forecast_remaining: float, is_deadline_week: bool}> $burnDownPoints
     */
    public function __construct(
        public readonly int $projectId,
        public readonly string $projectName,
        public readonly string $baselineDeadline,
        public readonly string $simulatedDeadline,
        public readonly float $baselineRemainingHours,
        public readonly float $simulatedRemainingHours,
        public readonly float $baselineWeeklyCapacity,
        public readonly float $simulatedWeeklyCapacity,
        public readonly int $baselineTeamSize,
        public readonly int $simulatedTeamSize,
        public readonly ?string $forecastFinishDate,
        public readonly ?int $finishDiffDays,
        public readonly bool $willMeetDeadline,
        public readonly array $burnDownPoints,
    ) {}

    public function toArray(): array
    {
        return [
            'project_id'                  => $this->projectId,
            'project_name'                => $this->projectName,
            'baseline_deadline'           => $this->baselineDeadline,
            'simulated_deadline'          => $this->simulatedDeadline,
            'baseline_remaining_hours'    => $this->baselineRemainingHours,
            'simulated_remaining_hours'   => $this->simulatedRemainingHours,
            'baseline_weekly_capacity'    => $this->baselineWeeklyCapacity,
            'simulated_weekly_capacity'   => $this->simulatedWeeklyCapacity,
            'baseline_team_size'          => $this->baselineTeamSize,
            'simulated_team_size'         => $this->simulatedTeamSize,
            'forecast_finish_date'        => $this->forecastFinishDate,
            'finish_diff_days'            => $this->finishDiffDays,
            'will_meet_deadline'          => $this->willMeetDeadline,
            'burn_down_points'            => $this->burnDownPoints,
        ];
    }
}
