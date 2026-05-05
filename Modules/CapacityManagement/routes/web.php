<?php

use Illuminate\Support\Facades\Route;
use Modules\CapacityManagement\Http\Controllers\CapacityManagementController;
use Modules\CapacityManagement\Http\Controllers\ProjectSimulationController;
use Modules\CapacityManagement\Http\Middleware\EnsureCapacityManagementAccess;

Route::middleware(['web', 'auth'])->group(function () {
    Route::prefix('capacity-management')->name('capacity-management.')->group(function () {
        Route::get('/', [CapacityManagementController::class, 'index'])
            ->middleware(EnsureCapacityManagementAccess::class)
            ->name('index');
        Route::patch('/users/{userId}/capacity', [CapacityManagementController::class, 'updateCapacity'])
            ->middleware(EnsureCapacityManagementAccess::class)
            ->name('users.capacity.update');

        // Project simulation
        Route::prefix('simulation/project')->name('simulation.project.')->middleware(EnsureCapacityManagementAccess::class)->group(function () {
            Route::get('/{project}', [ProjectSimulationController::class, 'show'])->name('show');
            Route::post('/{project}/run', [ProjectSimulationController::class, 'run'])->name('run');
        });
    });
});
