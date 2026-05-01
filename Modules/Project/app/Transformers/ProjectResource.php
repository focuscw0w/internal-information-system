<?php

namespace Modules\Project\Transformers;

use App\Enums\PermissionEnum;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Project\Enums\ProjectPermission;

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

            'owner_id' => $this->owner_id,
            'is_overdue' => $this->is_overdue,
            'days_remaining' => $this->days_remaining,
            'is_at_risk' => $this->is_at_risk,

            'owner' => $this->whenLoaded('owner', function () {
                return [
                    'id' => $this->owner->id,
                    'name' => $this->owner->name,
                    'email' => $this->owner->email,
                ];
            }),

            'tasks' => $this->whenLoaded('tasks', function () {
                return $this->tasks->map(function ($task) {
                    $predecessors = $task->relationLoaded('predecessors')
                        ? $task->predecessors
                        : collect();
                    $successors = $task->relationLoaded('successors')
                        ? $task->successors
                        : collect();

                    return [
                        'id' => $task->id,
                        'title' => $task->title,
                        'description' => $task->description,
                        'status' => $task->status,
                        'priority' => $task->priority,
                        'estimated_hours' => (int) $task->estimated_hours,
                        'actual_hours' => round((float) $task->actual_hours, 2),
                        'start_date' => $task->start_date?->format('Y-m-d') ?? $task->created_at->format('Y-m-d'),
                        'due_date' => $task->due_date?->format('Y-m-d'),
                        'is_at_risk' => $task->is_at_risk,
                        'at_risk_reason' => $task->at_risk_reason,
                        'assigned_users' => $task->assignedUsers->map(function ($user) {
                            return [
                                'id' => $user->id,
                                'name' => $user->name,
                                'email' => $user->email,
                            ];
                        }),
                        'predecessor_ids' => $predecessors->pluck('id')->values(),
                        'successor_ids' => $successors->pluck('id')->values(),
                        'blocking_predecessors_count' => $predecessors
                            ->reject(fn ($p) => $p->status === 'done')
                            ->count(),
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

            'activities' => $this->whenLoaded('activities', function () {
                return $this->activities->map(function ($activity) {
                    return [
                        'id' => $activity->id,
                        'type' => $activity->type,
                        'description' => $activity->description,
                        'metadata' => $activity->metadata,
                        'user' => [
                            'id' => $activity->user->id,
                            'name' => $activity->user->name,
                        ],
                        'created_at' => $activity->created_at->toISOString(),
                    ];
                });
            }),

            'team' => $this->whenLoaded('team', function () {
                return $this->team->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email ?? null,
                        'permissions' => $this->resource->userPermissions($member),
                        'allocation' => $member->pivot->allocation ?? 100,
                    ];
                });
            }),

            'current_user_permissions' => $this->when(auth()->check(), function () {
                $user = auth()->user();

                if ($user->hasPermissionTo(PermissionEnum::PROJECTS_VIEW_ALL->value)) {
                    return ProjectPermission::allValues();
                }

                return $this->resource->userPermissions($user);
            }),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
