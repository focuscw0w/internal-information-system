<?php

namespace Modules\Project\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Project\Enums\TaskStatus;
use Modules\Project\Enums\TaskPriority;

class UpdateTaskRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => ['sometimes', Rule::in(TaskStatus::values())],
            'priority' => ['sometimes', Rule::in(TaskPriority::values())],
            'estimated_hours' => 'nullable|numeric|min:0',
            'due_date' => 'nullable|date',
            'assigned_users' => 'sometimes|array',
            'assigned_users.*' => 'exists:users,id',
        ];
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get status as enum (with default)
     */
    public function getStatusEnum(): TaskStatus
    {
        $status = $this->validated()['status'] ?? null;
        return $status ? TaskStatus::from($status) : TaskStatus::TODO;
    }

    /**
     * Get priority as enum (with default)
     */
    public function getPriorityEnum(): TaskPriority
    {
        $priority = $this->validated()['priority'] ?? null;
        return $priority ? TaskPriority::from($priority) : TaskPriority::MEDIUM;
    }
}
