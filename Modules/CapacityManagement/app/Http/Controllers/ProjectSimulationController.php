<?php

namespace Modules\CapacityManagement\Http\Controllers;

use App\Enums\PermissionEnum;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\CapacityManagement\DTO\ProjectSimulationInput;
use Modules\CapacityManagement\Http\Requests\ProjectSimulationRequest;
use Modules\CapacityManagement\Services\ProjectSimulationService;
use Modules\Project\Models\Project;

class ProjectSimulationController extends Controller
{
    public function __construct(
        private readonly ProjectSimulationService $simulationService,
    ) {}

    /**
     * Show the project simulation page with baseline data.
     */
    public function show(Request $request, Project $project)
    {
        $input      = new ProjectSimulationInput();
        $simulation = $this->simulationService->simulate($project, $input);

        return Inertia::render('CapacityManagement/ProjectSimulation', [
            'project'    => [
                'id'     => $project->id,
                'name'   => $project->name,
                'status' => $project->status,
            ],
            'simulation' => $simulation->toArray(),
            'can_manage' => $request->user()?->can(PermissionEnum::CAPACITY_MANAGE->value) ?? false,
        ]);
    }

    /**
     * Run simulation with overrides from sliders. Nothing is persisted.
     */
    public function run(ProjectSimulationRequest $request, Project $project)
    {
        $input      = ProjectSimulationInput::fromValidated($request->validated());
        $simulation = $this->simulationService->simulate($project, $input);

        if ($request->expectsJson()) {
            return response()->json([
                'simulation' => $simulation->toArray(),
            ]);
        }

        return Inertia::render('CapacityManagement/ProjectSimulation', [
            'simulation' => $simulation->toArray(),
        ]);
    }
}
