<?php

namespace Modules\TimeTracking\Http\Controllers;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Project\Contracts\ProjectServiceInterface;

class TimeTrackingController extends Controller
{
    public function __construct(private readonly ProjectServiceInterface $projectService)
    {
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $projects = $this->projectService->getAllProjects();

        return Inertia::render('TimeTracking/Index', ['projects' => $projects]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('timetracking::create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
    }

    /**
     * Show the specified resource.
     */
    public function show($id)
    {
        return view('timetracking::show');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        return view('timetracking::edit');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
    }
}
