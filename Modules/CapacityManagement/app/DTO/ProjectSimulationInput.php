<?php

namespace Modules\CapacityManagement\DTO;

class ProjectSimulationInput
{
    public function __construct(
        /** Shift deadline by N days (negative = earlier, positive = later) */
        public readonly int $deadlineDaysShift = 0,
        /** Override team size (null = use current) */
        public readonly ?int $teamSize = null,
        /** Override remaining hours (null = calculate from tasks) */
        public readonly ?float $remainingHours = null,
    ) {}

    public static function fromValidated(array $data): self
    {
        return new self(
            deadlineDaysShift: (int) ($data['deadline_days_shift'] ?? 0),
            teamSize: isset($data['team_size']) ? (int) $data['team_size'] : null,
            remainingHours: isset($data['remaining_hours']) ? (float) $data['remaining_hours'] : null,
        );
    }

    public function isEmpty(): bool
    {
        return $this->deadlineDaysShift === 0
            && $this->teamSize === null
            && $this->remainingHours === null;
    }
}
