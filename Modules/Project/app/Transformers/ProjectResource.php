<?php

namespace Modules\Project\Transformers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'workload' => $this->workload,
            'progress' => $this->progress,
            'start_date' => $this->start_date->format('Y-m-d'),
            'end_date' => $this->end_date->format('Y-m-d'),
            'team_size' => $this->team_size,
            'tasks_total' => $this->tasks_total,
            'tasks_completed' => $this->tasks_completed,
            'capacity_used' => $this->capacity_used,
            'capacity_available' => $this->capacity_available,
            'is_overdue' => $this->is_overdue,
            'days_remaining' => $this->days_remaining,
            'team' => $this->whenLoaded('team', function () {
                return $this->team->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'role' => $member->pivot->role,
                        'allocation' => $member->pivot->allocation,
                    ];
                });
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
