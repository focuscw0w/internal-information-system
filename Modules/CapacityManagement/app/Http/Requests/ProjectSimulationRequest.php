<?php

namespace Modules\CapacityManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProjectSimulationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route middleware handles permissions
    }

    public function rules(): array
    {
        return [
            'deadline_days_shift' => ['sometimes', 'integer', 'min:-90', 'max:365'],
            'team_size'           => ['sometimes', 'nullable', 'integer', 'min:0', 'max:50'],
            'remaining_hours'     => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:10000'],
        ];
    }
}
