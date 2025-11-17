<?php

namespace Modules\Project\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Project\Http\Requests\EditProjectRequest;
use Modules\Project\Http\Requests\StoreProjectRequest;
use Modules\Project\Models\Project;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $projects = Project::query()->latest()->get();

        return Inertia::render("projects", ["projects" => $projects]);
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
    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $project = Project::create($request->validated());

        return redirect()
            ->route('project.show', $project)
            ->with('success', 'Projekt bol vytvorený.');
    }

    /**
     * Show the specified resource.
     */
    public function show(Project $project)
    {
        return Inertia::render('project', [
            'project' => $project,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        return view('project::edit');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(EditProjectRequest $request, $id)
    {
        $project = Project::findOrFail($id);
        $project->update($request->validated());

        return redirect()
            ->route('project.show', $project)
            ->with('success', 'Projekt bol aktualizovaný.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id): void
    {
        Project::findOrFail($id)->delete();
    }
}
