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
use Modules\Project\Http\Requests\LogHoursRequest;
use Modules\Project\Transformers\ProjectResource;

class TaskController extends Controller
{
    public function __construct(protected TaskService $taskService, protected ProjectService $projectService)
    {
    }

    /**
     * Store a newly created task-detail
     */
    public function store(CreateTaskRequest $request, int $projectId)
    {
        $task = $this->taskService->createTask($projectId, $request->validated());

        return redirect()
            ->route('projects.project-detail', [$projectId, $task->id])
            ->with('success', 'Task was successfully created.');
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

        $task->load(['subtasks', 'assignedUsers', 'comments.user']);

        $project = $this->projectService->getProjectById($projectId);
        if (!$project) {
            return redirect()->route('projects.show', $projectId);
        }

        $project->load(['owner', 'team', 'tasks.assignedUsers', 'allocations.user', 'activities.user']);

        return Inertia::render('Project/Task', [
            'task' => $task,
            'project' => (new ProjectResource($project))->resolve(),
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
            ->with('success', 'Task was successfully updated.');
    }

    /**
     * Remove the specified task-detail
     */
    public function destroy(int $projectId, int $taskId)
    {
        $this->taskService->deleteTask($taskId);

        return redirect()
            ->route('projects.project-detail', $projectId)
            ->with('success', 'Task was successfully deleted.');
    }

    /**
     * Assign task-detail to a user
     */
    public function assign(AssignTaskRequest $request, int $projectId, int $taskId)
    {
        $this->taskService->assignTask($taskId, $request->validated('assigned_users'));

        return back()->with('success', 'Members were successfully assigned.');
    }

    /**
     * Update task-detail status
     */
    public function updateStatus(UpdateTaskStatusRequest $request, int $projectId, int $taskId)
    {
        $this->taskService->updateTaskStatus($taskId, $request->validated('status'));

        return back()->with('success', 'Status was successfully updated.');
    }

    /**
     * Increment actual hours on a task by the given amount.
     */
    public function logHours(LogHoursRequest $request, int $projectId, int $taskId)
    {
        $this->taskService->logHours($taskId, $request->validated('hours'));

        return redirect()
            ->route('projects.tasks.show', [$projectId, $taskId])
            ->with('success', 'Hodiny boli zaznamenané.');
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
