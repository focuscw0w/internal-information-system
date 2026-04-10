<?php

namespace Modules\CapacityManagement\DTO;

use Carbon\CarbonImmutable;

class SimulationDeadlineOverride
{
    public function __construct(
        public readonly int $projectId,
        public readonly CarbonImmutable $newEndDate,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            projectId: (int) $data['project_id'],
            newEndDate: CarbonImmutable::parse($data['new_end_date']),
        );
    }
}
