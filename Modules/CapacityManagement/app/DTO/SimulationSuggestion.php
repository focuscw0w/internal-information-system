<?php

namespace Modules\CapacityManagement\DTO;

class SimulationSuggestion
{
    public function __construct(
        public readonly string $id,
        public readonly string $type,
        public readonly string $severity,   // info | warning | critical
        public readonly string $title,
        public readonly string $rationale,
        public readonly array $proposedChange,  // same shape as SimulationInput payload
        public readonly ?int $affectsUserId = null,
        public readonly ?int $affectsProjectId = null,
    ) {}

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'severity' => $this->severity,
            'title' => $this->title,
            'rationale' => $this->rationale,
            'proposed_change' => $this->proposedChange,
            'affects' => array_filter([
                'user_id' => $this->affectsUserId,
                'project_id' => $this->affectsProjectId,
            ]),
        ];
    }
}
