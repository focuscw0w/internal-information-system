<?php

namespace Modules\Project\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\Project\Contracts\TaskDependencyServiceInterface;
use Modules\Project\Http\Requests\TaskDependency\StoreTaskDependencyRequest;
use Modules\Project\Http\Requests\TaskDependency\SyncTaskDependenciesRequest;
use Modules\Project\Models\Task;

class TaskDependencyController extends Controller
{
    public function __construct(
        private readonly TaskDependencyServiceInterface $dependencyService
    ) {}

    public function store(StoreTaskDependencyRequest $request, int $projectId, Task $task): RedirectResponse
    {
        $this->dependencyService->add(
            $task,
            (int) $request->validated('depends_on_task_id')
        );

        return back()->with('success', 'Závislosť bola pridaná.');
    }

    public function sync(SyncTaskDependenciesRequest $request, int $projectId, Task $task): RedirectResponse
    {
        $this->dependencyService->sync(
            $task,
            $request->validated('predecessor_ids') ?? []
        );

        return back()->with('success', 'Závislosti boli aktualizované.');
    }

    public function destroy(int $projectId, Task $task, int $predecessor): RedirectResponse
    {
        $this->dependencyService->remove($task, $predecessor);

        return back()->with('success', 'Závislosť bola odstránená.');
    }
}
