<?php

namespace Modules\CapacityManagement\DTO;

use Modules\CapacityManagement\Enums\SimulationTeamAction;

class SimulationTeamChange
{
    public function __construct(
        public readonly int $projectId,
        public readonly int $userId,
        public readonly SimulationTeamAction $action,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            projectId: (int) $data['project_id'],
            userId: (int) $data['user_id'],
            action: SimulationTeamAction::from($data['action']),
        );
    }
}
