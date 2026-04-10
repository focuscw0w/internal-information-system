<?php

namespace Modules\CapacityManagement\DTO;

class SimulationResult
{
    /**
     * @param  array               $baseline     Same shape as CapacityManagementService::buildDashboard()
     * @param  array               $simulated    Same shape as baseline
     * @param  array               $delta        Computed diff between baseline and simulated
     * @param  SimulationSuggestion[] $suggestions
     * @param  SimulationInput     $input        Echo of the input used
     */
    public function __construct(
        public readonly array $baseline,
        public readonly array $simulated,
        public readonly array $delta,
        public readonly array $suggestions,
        public readonly SimulationInput $input,
    ) {}

    public function toArray(): array
    {
        return [
            'baseline' => $this->baseline,
            'simulated' => $this->simulated,
            'delta' => $this->delta,
            'suggestions' => array_map(fn (SimulationSuggestion $s) => $s->toArray(), $this->suggestions),
            'input' => [
                'capacity_overrides' => $this->input->capacityOverrides,
                'allocation_overrides' => array_map(fn ($a) => [
                    'project_id' => $a->projectId,
                    'user_id' => $a->userId,
                    'allocation_id' => $a->allocationId,
                    'allocated_hours' => $a->allocatedHours,
                    'percentage' => $a->percentage,
                    'start_date' => $a->startDate?->toDateString(),
                    'end_date' => $a->endDate?->toDateString(),
                    'delete' => $a->delete,
                ], $this->input->allocationOverrides),
                'deadline_overrides' => array_map(fn ($d) => [
                    'project_id' => $d->projectId,
                    'new_end_date' => $d->newEndDate->toDateString(),
                ], $this->input->deadlineOverrides),
                'team_changes' => array_map(fn ($t) => [
                    'project_id' => $t->projectId,
                    'user_id' => $t->userId,
                    'action' => $t->action->value,
                ], $this->input->teamChanges),
            ],
        ];
    }
}
