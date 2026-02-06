<?php

namespace Modules\Project\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['planning', 'active', 'on_hold', 'completed', 'cancelled'])],
            'workload' => ['required', Rule::in(['low', 'medium', 'high'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Názov projektu je povinný.',
            'end_date.after_or_equal' => 'Dátum konca musí byť rovnaký alebo neskorší ako dátum začiatku.',
            'budget.numeric' => 'Rozpočet musí byť číslo.',
            'budget.min' => 'Rozpočet nemôže byť záporný.',
        ];
    }
}