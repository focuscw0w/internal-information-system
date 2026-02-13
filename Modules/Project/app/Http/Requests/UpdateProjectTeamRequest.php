<?php

namespace Modules\Project\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Project\Enums\ProjectPermission;

class UpdateProjectTeamRequest extends FormRequest
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
            'team_members' => ['nullable', 'array'],
            'team_members.*' => ['integer', 'exists:users,id'],
            'team_settings' => ['nullable', 'array'],
            'team_settings.*.allocation' => ['nullable', 'integer', 'min:0', 'max:200'],
            'team_settings.*.permissions' => ['nullable', 'array'],
            'team_settings.*.permissions.*' => [
                'string',
                Rule::in(
                    ProjectPermission::values()
                ),
            ],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'team_members.required' => 'Členovia tímu sú povinní.',
            'team_members.*.exists' => 'Vybraný používateľ neexistuje.',
            'team_settings.*.allocation.min' => 'Alokácia musí byť minimálne 0%.',
            'team_settings.*.allocation.max' => 'Alokácia nesmie presiahnuť 200%.',
            'team_settings.*.permissions.*.in' => 'Neplatné oprávnenie.',
        ];
    }
}