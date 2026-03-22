<?php

namespace Modules\Project\Transformers;

use Illuminate\Http\Resources\Json\JsonResource;

class ProjectSummaryResource extends JsonResource
{
    private int $userId;

    public function __construct($resource, int $userId)
    {
        parent::__construct($resource);
        $this->userId = $userId;
    }

    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'role' => $this->owner_id === $this->userId ? 'Vlastník' : 'Člen tímu',

            'permissions' => $this->whenLoaded('team', function () {
                $member = $this->team->where('id', $this->userId)->first();

                return $member
                    ? $this->resource->userPermissions($member)
                    : [];
            }),

            'tasks_assigned' => $this->whenLoaded('tasks', function () {
                return $this->tasks
                    ->where('assigned_to', $this->userId)
                    ->count();
            }),

            'tasks_completed' => $this->whenLoaded('tasks', function () {
                return $this->tasks
                    ->where('assigned_to', $this->userId)
                    ->where('status', 'done')
                    ->count();
            }),
        ];
    }

    public static function collectionForUser($resource, int $userId)
    {
        return $resource->map(fn ($project) => (new static($project, $userId))->resolve());
    }
}
