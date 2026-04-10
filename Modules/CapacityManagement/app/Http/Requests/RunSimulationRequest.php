<?php

namespace Modules\CapacityManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RunSimulationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route middleware handles auth/permissions
    }

    public function rules(): array
    {
        return [
            // [user_id => hours]
            'capacity_overrides'                    => ['sometimes', 'array'],
            'capacity_overrides.*'                  => ['integer', 'min:1', 'max:100'],

            // Allocation overrides
            'allocation_overrides'                  => ['sometimes', 'array'],
            'allocation_overrides.*.project_id'     => ['required_with:allocation_overrides', 'integer', 'exists:projects,id'],
            'allocation_overrides.*.user_id'        => ['required_with:allocation_overrides', 'integer', 'exists:users,id'],
            'allocation_overrides.*.allocation_id'  => ['sometimes', 'nullable', 'integer'],
            'allocation_overrides.*.allocated_hours' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'allocation_overrides.*.percentage'     => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100'],
            'allocation_overrides.*.start_date'     => ['sometimes', 'nullable', 'date'],
            'allocation_overrides.*.end_date'       => ['sometimes', 'nullable', 'date'],
            'allocation_overrides.*.delete'         => ['sometimes', 'boolean'],

            // Deadline overrides
            'deadline_overrides'                    => ['sometimes', 'array'],
            'deadline_overrides.*.project_id'       => ['required_with:deadline_overrides', 'integer', 'exists:projects,id'],
            'deadline_overrides.*.new_end_date'     => ['required_with:deadline_overrides', 'date'],

            // Team changes
            'team_changes'                          => ['sometimes', 'array'],
            'team_changes.*.project_id'             => ['required_with:team_changes', 'integer', 'exists:projects,id'],
            'team_changes.*.user_id'                => ['required_with:team_changes', 'integer', 'exists:users,id'],
            'team_changes.*.action'                 => ['required_with:team_changes', 'in:add,remove'],
        ];
    }
}
