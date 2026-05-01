<?php

namespace Modules\Project\Http\Requests\TaskDependency;

use Illuminate\Foundation\Http\FormRequest;

class SyncTaskDependenciesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'predecessor_ids' => ['nullable', 'array'],
            'predecessor_ids.*' => ['integer', 'exists:tasks,id'],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
