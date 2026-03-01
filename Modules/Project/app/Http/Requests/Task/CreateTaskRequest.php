<?php

namespace Modules\Project\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Project\Enums\TaskPriority;
use Modules\Project\Enums\TaskStatus;

class CreateTaskRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => ['required', Rule::in(TaskStatus::values())],
            'priority' => ['required', Rule::in(TaskPriority::values())],
            'estimated_hours' => 'required|numeric|min:0',
            'due_date' => 'required|date',
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
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Názov úlohy je povinný.',
            'title.max' => 'Názov úlohy môže mať maximálne 255 znakov.',
            'status.required' => 'Stav úlohy je povinný.',
            'status.in' => 'Neplatný stav úlohy.',
            'priority.required' => 'Priorita je povinná.',
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
