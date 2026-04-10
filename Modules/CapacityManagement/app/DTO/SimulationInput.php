<?php

namespace Modules\CapacityManagement\DTO;

class SimulationInput
{
    /**
     * @param  array<int,int>                    $capacityOverrides     user_id → new weekly_capacity_hours
     * @param  SimulationAllocationOverride[]     $allocationOverrides
     * @param  SimulationDeadlineOverride[]       $deadlineOverrides
     * @param  SimulationTeamChange[]             $teamChanges
     */
    public function __construct(
        public readonly array $capacityOverrides = [],
        public readonly array $allocationOverrides = [],
        public readonly array $deadlineOverrides = [],
        public readonly array $teamChanges = [],
    ) {}

    public static function fromValidated(array $data): self
    {
        return new self(
            capacityOverrides: array_map(
                'intval',
                (array) ($data['capacity_overrides'] ?? [])
            ),
            allocationOverrides: array_map(
                fn (array $a) => SimulationAllocationOverride::fromArray($a),
                (array) ($data['allocation_overrides'] ?? [])
            ),
            deadlineOverrides: array_map(
                fn (array $d) => SimulationDeadlineOverride::fromArray($d),
                (array) ($data['deadline_overrides'] ?? [])
            ),
            teamChanges: array_map(
                fn (array $t) => SimulationTeamChange::fromArray($t),
                (array) ($data['team_changes'] ?? [])
            ),
        );
    }

    public function isEmpty(): bool
    {
        return empty($this->capacityOverrides)
            && empty($this->allocationOverrides)
            && empty($this->deadlineOverrides)
            && empty($this->teamChanges);
    }
}
