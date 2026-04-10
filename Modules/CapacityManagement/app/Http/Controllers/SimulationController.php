<?php

namespace Modules\CapacityManagement\Http\Controllers;

use App\Enums\PermissionEnum;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\CapacityManagement\Contracts\SimulationServiceInterface;
use Modules\CapacityManagement\DTO\SimulationInput;
use Modules\CapacityManagement\Http\Requests\RunSimulationRequest;
use Modules\Project\Models\Project;
use Modules\Project\Models\ProjectAllocation;
use Modules\User\Contracts\UserServiceInterface;

class SimulationController extends Controller
{
    public function __construct(
        private readonly SimulationServiceInterface $simulationService,
        private readonly UserServiceInterface $userService,
    ) {}

    /**
     * Show the What-If simulation page with a baseline (no overrides yet).
     */
    public function index(Request $request)
    {
        $input  = new SimulationInput;
        $result = $this->simulationService->simulate($input);

        return Inertia::render('CapacityManagement/Simulation', [
            'simulation'  => $result->toArray(),
            'can_manage'  => $request->user()?->can(PermissionEnum::CAPACITY_MANAGE->value) ?? false,
            'users'       => $this->userService->getAllUsers()->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]),
            'projects'    => Project::active()->get(['id', 'name', 'end_date']),
            'allocations' => ProjectAllocation::with('project:id,name', 'user:id,name')->active()->get(),
        ]);
    }

    /**
     * Run simulation with the given overrides and return updated props.
     * Never persists anything to the database.
     */
    public function run(RunSimulationRequest $request)
    {
        $input  = SimulationInput::fromValidated($request->validated());
        $result = $this->simulationService->simulate($input);

        return Inertia::render('CapacityManagement/Simulation', [
            'simulation' => $result->toArray(),
        ]);
    }
}
