<?php

namespace Modules\Project\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Project\Contracts\ProjectServiceInterface;
use Modules\Project\Http\Requests\Project\CreateProjectRequest;
use Modules\Project\Http\Requests\Project\UpdateProjectRequest;
use Modules\Project\Transformers\ProjectResource;

class ProjectController extends Controller
{
    public function __construct(
        protected ProjectServiceInterface $projectService
    ) {
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $projects = $this->projectService->getAllProjects();

        return Inertia::render('Project/Index', [
            'title' => 'Projekty',
            'projects' => ProjectResource::collection($projects)->resolve(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CreateProjectRequest $request)
    {
        try {
            $project = $this->projectService->createProject($request->validated());

            return redirect()
                ->route('projects.projects')
                ->with('success', 'Project was successfully created.');
        } catch (\Exception $e) {
            \Log::error('Project creation failed:', [
                'error' => $e->getMessage(),
                'data' => $request->validated(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()
                ->withInput()
                ->withErrors(['error' => 'Failed to create project.']);
        }
    }

    /**
     * Show the specified resource.
     */
    public function show($id)
    {
        $project = $this->projectService->getProjectById($id);

        if (!$project) {
            return redirect()
                ->route('projects.projects')
                ->with('error', 'Project not found.');
        }

        $project->load([
            'tasks.assignedUsers',
            'allocations.user',
            'activities.user',
            'owner',
            'team',
        ]);

        // $allUsers = User::select("id", "name", "email")->get();

        return Inertia::render('Project/Show', [
            'project' => (new ProjectResource($project))->resolve(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProjectRequest $request, $id)
    {
        $project = $this->projectService->updateProject($id, $request->validated());
        if (!$project) {
            return redirect()->back()->with('error', 'Project not found.');
        }

        return redirect()->back()->with('success', 'Project was successfully updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $isDeleted = $this->projectService->deleteProject($id);
        if (!$isDeleted) {
            return redirect()->back()->with('error', 'Project was not deleted.');
        }

        return redirect()->back()->with('success', 'Project was successfully deleted.');
    }
}
