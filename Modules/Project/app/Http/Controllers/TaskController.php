<?php

namespace Modules\Project\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Project\App\Services\ProjectService;
use Modules\Project\Services\TaskService;
use Modules\Project\Http\Requests\CreateTaskRequest;
use Modules\Project\Http\Requests\UpdateTaskRequest;
use Modules\Project\Http\Requests\UpdateTaskStatusRequest;
use Modules\Project\Http\Requests\AssignTaskRequest;

class TaskController extends Controller
{
    public function __construct(protected TaskService $taskService, protected ProjectService $projectService)
    {
    }

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
     * Store a newly created task-detail
     */
    public function store(CreateTaskRequest $request, int $projectId)
    {
        $task = $this->taskService->createTask($projectId, $request->validated());

        return redirect()
            ->route('projects.project-detail', [$projectId, $task->id])
            ->with('success', 'Úloha bola úspešne vytvorená.');
    }

    /**
     * Display the specified task-detail
     */
    public function show(int $projectId, int $taskId)
    {
        $task = $this->taskService->getTaskById($taskId);
        if (!$task) {
            return redirect()->route('projects.show', $projectId);
        }

        $project = $this->projectService->getProjectById($projectId);
        if (!$project) {
            return redirect()->route('projects.show', $projectId);
        }

        return Inertia::render('Project/Task', [
            'task' => $task,
            'project' => $project,
        ]);
    }

    /**
     * Update the specified task-detail
     */
    public function update(UpdateTaskRequest $request, int $projectId, int $taskId)
    {
        $task = $this->taskService->updateTask($taskId, $request->validated());

        return redirect()
            ->route('projects.project-detail', [$projectId, $task->id])
            ->with('success', 'Úloha bola úspešne aktualizovaná.');
    }

    /**
     * Remove the specified task-detail
     */
    public function destroy(int $projectId, int $taskId)
    {
        $this->taskService->deleteTask($taskId);

        return redirect()
            ->route('projects.project-detail', $projectId)
            ->with('success', 'Úloha bola úspešne zmazaná.');
    }

    /**
     * Assign task-detail to a user
     */
    public function assign(AssignTaskRequest $request, int $taskId)
    {
        $this->taskService->assignTask($taskId, $request->validated('assigned_users'));

        return back()->with('success', 'Členovia boli priradení.');
    }

    /**
     * Update task-detail status
     */
    public function updateStatus(UpdateTaskStatusRequest $request, int $taskId)
    {
        $task = $this->taskService->updateTaskStatus($taskId, $request->validated('status'));

        return back()->with('success', 'Stav úlohy bol aktualizovaný.');
    }

    /**
     * AI estimate task-detail hours
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
