<?php

namespace Modules\Project\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Project\Http\Requests\UpdateProjectRequest;
use Modules\Project\App\Services\ProjectService;
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
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('project::create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:planning,active,on_hold,completed,cancelled',
            'workload' => 'required|in:low,medium,high',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'budget' => 'nullable|numeric|min:0',
        ]);

        try {
            $project = $this->projectService->createProject($validated);

            return redirect()
                ->route('project.index')
                ->with('success', 'Projekt bol úspešne vytvorený.');

        } catch (\Exception $e) {
            \Log::error('Project creation failed:', [
                'error' => $e->getMessage(),
                'data' => $validated,
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

        return Inertia::render('project/show', [
            'project' => $project,
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
}
