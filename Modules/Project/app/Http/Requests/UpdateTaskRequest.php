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
            'estimated_hours' => 'sometimes|required|numeric|min:0',
            'due_date' => 'sometimes|required|date',
            'assigned_users' => 'sometimes|array',
            'assigned_users.*' => 'exists:users,id',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages()
    {
       return [
           'title.required' => 'Názov úlohy je povinný.',
           'title.max' => 'Názov úlohy môže mať maximálne 255 znakov.',
           'status.in' => 'Neplatný stav úlohy.',
           'priority.in' => 'Priorita musí byť low, medium alebo high.',
           'estimated_hours.required' => 'Odhadovaný čas je povinný.',
           'estimated_hours.numeric' => 'Odhadovaný čas musí byť číslo.',
           'estimated_hours.min' => 'Odhadovaný čas nemôže byť záporný.',
           'due_date.required' => 'Termín dokončenia je povinný.',
           'due_date.date' => 'Termín dokončenia musí byť platný dátum.',
           'assigned_users.array' => 'Priradení používatelia musia byť pole.',
           'assigned_users.*.exists' => 'Vybraný používateľ neexistuje.',
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
