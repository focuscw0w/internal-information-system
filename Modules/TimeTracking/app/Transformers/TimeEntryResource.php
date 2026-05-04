<?php

namespace Modules\TimeTracking\Transformers;
 
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
 
class TimeEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_name' => $this->project->name ?? '',
            'task_title' => $this->task->title ?? '',
            'hours' => $this->hours,
            'entry_date' => $this->entry_date,
            'description' => $this->description,
            'status' => $this->status,
        ];
    }
}
