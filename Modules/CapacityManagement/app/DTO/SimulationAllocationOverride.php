<?php

namespace Modules\CapacityManagement\DTO;

use Carbon\CarbonImmutable;

class SimulationAllocationOverride
{
    public function __construct(
        public readonly int $projectId,
        public readonly int $userId,
        public readonly ?int $allocationId = null,      // null = new allocation
        public readonly ?int $allocatedHours = null,
        public readonly ?int $percentage = null,
        public readonly ?CarbonImmutable $startDate = null,
        public readonly ?CarbonImmutable $endDate = null,
        public readonly bool $delete = false,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            projectId: (int) $data['project_id'],
            userId: (int) $data['user_id'],
            allocationId: isset($data['allocation_id']) ? (int) $data['allocation_id'] : null,
            allocatedHours: isset($data['allocated_hours']) ? (int) $data['allocated_hours'] : null,
            percentage: isset($data['percentage']) ? (int) $data['percentage'] : null,
            startDate: isset($data['start_date']) ? CarbonImmutable::parse($data['start_date']) : null,
            endDate: isset($data['end_date']) ? CarbonImmutable::parse($data['end_date']) : null,
            delete: (bool) ($data['delete'] ?? false),
        );
    }
}
