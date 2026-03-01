<?php

namespace Modules\Project\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;

class AssignTaskRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'assigned_users' => 'present|array',
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
            'assigned_users.required' => 'Vyberte aspoň jedného používateľa.',
            'assigned_users.array' => 'Neplatný formát dát.',
            'assigned_users.*.exists' => 'Vybraný používateľ neexistuje.',
        ];
    }
}
