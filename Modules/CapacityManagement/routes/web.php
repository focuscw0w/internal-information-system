<?php

use Illuminate\Support\Facades\Route;
use Modules\CapacityManagement\Http\Controllers\CapacityManagementController;
use Modules\CapacityManagement\Http\Controllers\SimulationController;
use Modules\CapacityManagement\Http\Middleware\EnsureCapacityManagementAccess;

Route::middleware(['web', 'auth'])->group(function () {
    Route::prefix('capacity-management')->name('capacity-management.')->group(function () {
        Route::get('/', [CapacityManagementController::class, 'index'])->name('index');
        Route::patch('/users/{userId}/capacity', [CapacityManagementController::class, 'updateCapacity'])
            ->middleware(EnsureCapacityManagementAccess::class)
            ->name('users.capacity.update');

        // What-If Simulation
        Route::get('/simulation', [SimulationController::class, 'index'])
            ->middleware(EnsureCapacityManagementAccess::class)
            ->name('simulation.index');
        Route::post('/simulation/run', [SimulationController::class, 'run'])
            ->middleware(EnsureCapacityManagementAccess::class)
            ->name('simulation.run');
    });
});
