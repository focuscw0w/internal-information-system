<?php

namespace Modules\CapacityManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Modules\CapacityManagement\Http\Requests\UpdateEmployeeCapacityRequest;
use Modules\CapacityManagement\Services\CapacityManagementService;

class CapacityManagementController extends Controller
{
    public function __construct(private readonly CapacityManagementService $capacityService)
    {
    }

    public function index()
    {
        return Inertia::render('CapacityManagement/Index', [
            'dashboard' => $this->capacityService->buildDashboard(),
        ]);
    }

    public function updateCapacity(UpdateEmployeeCapacityRequest $request, int $userId)
    {
        $this->capacityService->setWeeklyCapacityForUser(
            $userId,
            (int) $request->validated('weekly_capacity_hours')
        );

        return redirect()
            ->route('capacity-management.index')
            ->with('success', 'Kapacita bola aktualizovaná.');
    }
}
