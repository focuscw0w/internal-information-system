<?php

namespace Modules\Project\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Project\App\Services\ProjectService;
use Modules\Project\Http\Requests\UpdateProjectRequest;
use Modules\Project\Http\Requests\CreateProjectRequest;
use Modules\Project\Http\Requests\UpdateProjectTeamRequest;
use Modules\Project\Transformers\ProjectResource;

class ProjectController extends Controller
{
    public function __construct(
        protected ProjectService $projectService
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
                ->route('projects.index')
                ->with('success', 'Projekt bol úspešne vytvorený.');
        } catch (\Exception $e) {
            \Log::error('Project creation failed:', [
                'error' => $e->getMessage(),
                'data' => $request->validated(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()
                ->withInput()
                ->withErrors(['error' => 'Nepodarilo sa vytvoriť projekt.']);
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
                ->route('project.index')
                ->with('error', 'Projekt nebol nájdený.');
        }

        $project->load([
            'tasks.assignedUser',
            'allocations.user',
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
            return redirect()->back()->with('error', 'Projekt nebol nájdený.');
        }

        return redirect()->back()->with('success', 'Projekt bol úspešne aktualizovaný.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $isDeleted = $this->projectService->deleteProject($id);
        if (!$isDeleted) {
            return redirect()->back()->with('error', 'Projekt se nepodařilo smazat.');
        }

        return redirect()->back()->with('success', 'Projekt bol úspešne odstránený.');
    }

    /**
     * Update project team
     */
    public function updateTeam(UpdateProjectTeamRequest $request, $id)
    {
        $project = $this->projectService->updateProjectTeam($id, $request->validated());

        if (!$project) {
            return redirect()->back()->with('error', 'Projekt nebol nájdený.');
        }

        return redirect()->back()->with('success', 'Tím bol úspešne aktualizovaný.');
    }
}
