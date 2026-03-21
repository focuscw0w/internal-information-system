<?php

namespace Modules\User\Http\Requests;

use App\Enums\PermissionEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        //return $this->user()->hasPermissionTo(PermissionEnum::USERS_MANAGE->value);
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->route('user')),
            ],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(PermissionEnum::all())],
        ];
    }
}
