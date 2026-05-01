<?php

namespace Modules\Project\Http\Requests\TaskDependency;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskDependencyRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'depends_on_task_id' => ['required', 'integer', 'exists:tasks,id'],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
