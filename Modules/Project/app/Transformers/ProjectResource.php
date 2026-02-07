<?php

namespace Modules\Project\Transformers;

use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'workload' => $this->workload,
            'progress' => (int) $this->progress,

            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'actual_start_date' => $this->actual_start_date?->format('Y-m-d'),
            'actual_end_date' => $this->actual_end_date?->format('Y-m-d'),

            'team_size' => $this->team_size,
            'tasks_total' => (int) $this->tasks_total,
            'tasks_completed' => (int) $this->tasks_completed,
            'capacity_used' => (int) $this->capacity_used,
            'capacity_available' => (int) $this->capacity_available,

            'budget' => (float) ($this->budget ?? 0),
            'budget_spent' => (float) ($this->budget_spent ?? 0),

            'owner_id' => $this->owner_id,
            'is_overdue' => $this->is_overdue,
            'days_remaining' => $this->days_remaining,

            'owner' => $this->whenLoaded('owner', function () {
                return [
                    'id' => $this->owner->id,
                    'name' => $this->owner->name,
                    'email' => $this->owner->email,
                ];
            }),

            'tasks' => $this->whenLoaded('tasks', function () {
                return $this->tasks->map(function ($task) {
                    return [
                        'id' => $task->id,
                        'title' => $task->title,
                        'description' => $task->description,
                        'status' => $task->status,
                        'priority' => $task->priority,
                        'estimated_hours' => (int) $task->estimated_hours,
                        'actual_hours' => (int) $task->actual_hours,
                        'due_date' => $task->due_date?->format('Y-m-d'),
                        'assigned_to' => $task->assigned_to,
                        'assigned_user' => $task->assignedUser ? [
                            'id' => $task->assignedUser->id,
                            'name' => $task->assignedUser->name,
                        ] : null,
                    ];
                });
            }),

            'allocations' => $this->whenLoaded('allocations', function () {
                return $this->allocations->map(function ($allocation) {
                    return [
                        'id' => $allocation->id,
                        'user_id' => $allocation->user_id,
                        'allocated_hours' => (int) $allocation->allocated_hours,
                        'used_hours' => (int) $allocation->used_hours,
                        'percentage' => (int) $allocation->percentage,
                        'start_date' => $allocation->start_date?->format('Y-m-d'),
                        'end_date' => $allocation->end_date?->format('Y-m-d'),
                        'user' => [
                            'id' => $allocation->user->id,
                            'name' => $allocation->user->name,
                            'email' => $allocation->user->email,
                        ],
                    ];
                });
            }),

            'team' => $this->whenLoaded('team', function () {
                return $this->team->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'role' => $member->pivot->role ?? null,
                        'allocation' => $member->pivot->allocation ?? null,
                    ];
                });
            }),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
