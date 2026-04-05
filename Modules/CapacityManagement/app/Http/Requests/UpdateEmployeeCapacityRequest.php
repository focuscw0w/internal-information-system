<?php

namespace Modules\CapacityManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeCapacityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'weekly_capacity_hours' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }
}
