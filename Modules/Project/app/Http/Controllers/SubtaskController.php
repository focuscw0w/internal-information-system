<?php

namespace Modules\Project\Http\Controllers;

use Illuminate\Routing\Controller;
use Modules\Project\Services\SubtaskService;
use Modules\Project\Http\Requests\CreateSubtaskRequest;
use Modules\Project\Http\Requests\UpdateSubtaskRequest;

class SubtaskController extends Controller
{
    public function __construct(protected SubtaskService $subtaskService)
    {
    }

    /**
     * Store a new subtask
     */
    public function store(CreateSubtaskRequest $request, int $projectId, int $taskId)
    {
        $this->subtaskService->createSubtask($taskId, $request->validated());

        return back()->with('success', 'Subtask was successfully created.');
    }

    /**
     * Update a subtask
     */
    public function update(UpdateSubtaskRequest $request, int $projectId, int $taskId, int $subtaskId)
    {
        $this->subtaskService->updateSubtask($subtaskId, $request->validated());

        return back()->with('success', 'Subtask was successfully updated.');
    }

    /**
     * Toggle subtask completion
     */
    public function toggle(int $projectId, int $taskId, int $subtaskId)
    {
        $this->subtaskService->toggleSubtask($subtaskId);

        return back()->with('success', 'Subtask was successfully changed.');
    }

    /**
     * Delete a subtask
     */
    public function destroy(int $projectId, int $taskId, int $subtaskId)
    {
        $this->subtaskService->deleteSubtask($subtaskId);

        return back()->with('success', 'Subtask was successfully deleted.');
    }
}
