<?php

namespace Modules\CapacityManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\CapacityManagement\Contracts\CapacityManagementServiceInterface;
use Modules\CapacityManagement\Enums\CapacityPermission;
use Modules\CapacityManagement\Http\Requests\UpdateEmployeeCapacityRequest;

class CapacityManagementController extends Controller
{
    public function __construct(private readonly CapacityManagementServiceInterface $capacityService)
    {
    }

    public function index(Request $request)
    {
        return Inertia::render('CapacityManagement/Index', [
            'dashboard' => $this->capacityService->buildDashboard(),
            'can_manage' => ($request->user()?->is_admin || $request->user()?->can(CapacityPermission::CAPACITY_MANAGE->value)) ?? false,
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
