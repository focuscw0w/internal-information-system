<?php

namespace Modules\Project\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Project\Enums\TaskStatus;

class UpdateTaskStatusRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(TaskStatus::values())],
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
            'status.required' => 'Stav je povinný.',
            'status.in' => 'Neplatný stav úlohy.',
        ];
    }

    /**
     * Get validated status as enum
     */
    public function getStatusEnum(): TaskStatus
    {
        return TaskStatus::from($this->validated()['status']);
    }
}
