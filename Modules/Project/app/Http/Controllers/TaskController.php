<?php

namespace Modules\Project\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Project\Services\TaskService;
use Modules\Project\Http\Requests\CreateTaskRequest;
use Modules\Project\Http\Requests\UpdateTaskRequest;

class TaskController extends Controller
{
    public function __construct(protected TaskService $taskService)
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
            'projectId' => $projectId
        ]);
    }
    
    /**
     * Show the form for creating a new task
     */
    public function create(int $projectId)
    {
        return Inertia::render('Projects::Tasks/Create', [
            'projectId' => $projectId
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
            'task' => $task
        ]);
    }
    
    /**
     * Show the form for editing the task
     */
    public function edit(int $projectId, int $taskId)
    {
        $task = $this->taskService->getTaskById($taskId);
        
        return Inertia::render('Projects::Tasks/Edit', [
            'task' => $task
        ]);
    }
    
    /**
     * Update the specified task
     */
    public function update(UpdateTaskRequest $request, int $projectId, int $taskId)
    {
        $task = $this->taskService->updateTask($taskId, $request->validated());
        
        return redirect()
            ->route('projects.tasks.show', [$projectId, $task->id])
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
    public function assign(Request $request, int $projectId, int $taskId)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);
        
        $task = $this->taskService->assignTask($taskId, $request->user_id);
        
        return back()->with('success', 'Úloha bola priradená.');
    }
    
    /**
     * Update task status
     */
    public function updateStatus(Request $request, int $projectId, int $taskId)
    {
        $request->validate([
            'status' => 'required|in:todo,in_progress,testing,done'
        ]);
        
        $task = $this->taskService->updateTaskStatus($taskId, $request->status);
        
        return back()->with('success', 'Stav úlohy bol aktualizovaný.');
    }
    
    /**
     * AI estimate task hours
     */
    public function estimateWithAI(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string'
        ]);
        
        $estimate = $this->taskService->estimateTaskWithAI(
            $request->title,
            $request->description ?? ''
        );
        
        return response()->json(['estimated_hours' => $estimate]);
    }
}