<?php

namespace Modules\Project\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Project\Http\Requests\CreateTaskRequest;
use Modules\Project\Http\Requests\UpdateTaskRequest;
use Modules\Project\Http\Requests\UpdateTaskStatusRequest;
use Modules\Project\Services\TaskService;

class TaskController extends Controller
{
    public function __construct(protected TaskService $taskService) {}

    /**
     * Display a listing of tasks for a project
     */
    public function index(int $projectId)
    {
        $tasks = $this->taskService->getAllTasks($projectId);

        return Inertia::render('Projects::Tasks/Index', [
            'tasks' => $tasks,
            'projectId' => $projectId,
        ]);
    }

    /**
     * Store a newly created task
     */
    public function store(CreateTaskRequest $request, int $projectId)
    {
        $task = $this->taskService->createTask($projectId, $request->validated());

        return redirect()
            ->route('projects.show', [$projectId, $task->id])
            ->with('success', 'Úloha bola úspešne vytvorená.');
    }

    /**
     * Display the specified task
     */
    public function show(int $projectId, int $taskId)
    {
        $task = $this->taskService->getTaskById($taskId);

        return Inertia::render('Project::Tasks/Show', [
            'task' => $task,
        ]);
    }

    /**
     * Update the specified task
     */
    public function update(UpdateTaskRequest $request, int $projectId, int $taskId)
    {
        $task = $this->taskService->updateTask($taskId, $request->validated());

        return redirect()
            ->route('projects.show', [$projectId, $task->id])
            ->with('success', 'Úloha bola úspešne aktualizovaná.');
    }

    /**
     * Remove the specified task
     */
    public function destroy(int $projectId, int $taskId)
    {
        $this->taskService->deleteTask($taskId);

        return redirect()
            ->route('projects.show', $projectId)
            ->with('success', 'Úloha bola úspešne zmazaná.');
    }

    /**
     * Assign task to a user
     */
    public function assign(AssignTaskRequest $request, int $taskId)
    {
        $task = $this->taskService->assignTask($taskId, $request->validated('user_id'));

        return back()->with('success', 'Úloha bola priradená.');
    }

    /**
     * Update task status
     */
    public function updateStatus(UpdateTaskStatusRequest $request, int $taskId)
    {
        $task = $this->taskService->updateTaskStatus($taskId, $request->validated('status'));

        return back()->with('success', 'Stav úlohy bol aktualizovaný.');
    }

    /**
     * AI estimate task hours
     */
    public function estimateWithAI(CreateTaskRequest $request)
    {
        $estimate = $this->taskService->estimateTaskWithAI(
            $request->validated('title'),
            $request->validated('description') ?? ''
        );

        return response()->json(['estimated_hours' => $estimate]);
    }
}
