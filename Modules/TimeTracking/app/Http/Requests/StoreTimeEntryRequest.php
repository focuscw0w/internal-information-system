<?php

namespace Modules\TimeTracking\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\TimeTracking\Contracts\Repositories\TimeTrackingProjectRepositoryInterface;
use Modules\TimeTracking\Contracts\Repositories\TimeTrackingTaskRepositoryInterface;

class StoreTimeEntryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $projects = app(TimeTrackingProjectRepositoryInterface::class);

        return $projects->userIsParticipant((int) $this->route('projectId'), $this->user());
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'task_id' => [
                'required',
                'integer',
                'exists:tasks,id',
                function ($attribute, $value, $fail) {
                    $routeProjectId = (int) $this->route('projectId');
                    $tasks = app(TimeTrackingTaskRepositoryInterface::class);
                    $task = $tasks->find((int) $value);

                    if (! $task || $task->project_id !== $routeProjectId) {
                        $fail('The selected task does not belong to this project.');
                        return;
                    }

                    $isAssigned = $tasks->assignedUserExists((int) $value, (int) auth()->id());

                    if (! $isAssigned) {
                        $fail('You are not assigned to this task.');
                    }
                },
            ],
            'entry_date' => ['required', 'date'],
            'hours' => ['required', 'numeric', 'min:0.25', 'max:24'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'task_id.required' => 'Úloha je povinná.',
            'task_id.exists' => 'Vybraná úloha neexistuje.',
            'entry_date.required' => 'Dátum je povinný.',
            'hours.required' => 'Počet hodín je povinný.',
            'hours.min' => 'Minimálny počet hodín je 0.25.',
            'hours.max' => 'Maximálny počet hodín je 24.',
            'description.max' => 'Popis môže mať maximálne 1000 znakov.',
        ];
    }
}
