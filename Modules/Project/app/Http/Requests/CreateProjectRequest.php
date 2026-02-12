<?php

namespace Modules\Project\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateProjectRequest extends FormRequest
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

            // Team members validation
            'team_members' => ['nullable', 'array'],
            'team_members.*' => ['integer', 'exists:users,id'],

            // Team settings validation
            'team_settings' => ['nullable', 'array'],
            'team_settings.*.allocation' => ['nullable', 'integer', 'min:0', 'max:200'],
            'team_settings.*.permissions' => ['nullable', 'array'],
            'team_settings.*.permissions.*' => [
                'string',
                Rule::in([
                    'view_project', 'edit_project', 'delete_project',
                    'view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks', 'assign_tasks',
                    'view_team', 'manage_team',
                    'view_budget', 'edit_budget',
                    'export_data',
                ]),
            ],
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
            'team_members.array' => 'Členovia tímu musia byť pole.',
            'team_members.*.exists' => 'Vybraný používateľ neexistuje.',
            'team_settings.*.allocation.integer' => 'Alokácia musí byť celé číslo.',
            'team_settings.*.allocation.min' => 'Alokácia musí byť minimálne 0%.',
            'team_settings.*.allocation.max' => 'Alokácia nesmie presiahnuť 200%.',
            'team_settings.*.permissions.*.in' => 'Neplatné oprávnenie.',
        ];
    }
}
