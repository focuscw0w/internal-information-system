<?php

namespace Modules\Project\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LogHoursRequest extends FormRequest
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
            'hours' => ['required', 'numeric', 'min:0.5', 'max:24'],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'hours.required' => 'Počet hodín je povinný.',
            'hours.numeric' => 'Počet hodín musí byť číslo.',
            'hours.min' => 'Minimálny počet hodín je 0.5.',
            'hours.max' => 'Maximálny počet hodín za jeden záznam je 24.',
        ];
    }
}
