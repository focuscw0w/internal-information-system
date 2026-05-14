<?php

use Illuminate\Support\Facades\Route;
use Modules\CapacityManagement\Http\Controllers\CapacityManagementController;
use Modules\CapacityManagement\Http\Controllers\DashboardController;
use Modules\CapacityManagement\Http\Controllers\ManagerController;
use Modules\CapacityManagement\Http\Controllers\ProjectSimulationController;
use Modules\CapacityManagement\Http\Middleware\EnsureCanAccessManagerArea;
use Modules\CapacityManagement\Http\Middleware\EnsureCapacityManagementAccess;

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('manager')
        ->name('manager.')
        ->middleware(EnsureCanAccessManagerArea::class)
        ->group(function () {
            Route::get('/', [ManagerController::class, 'dashboard'])->name('dashboard');
            Route::redirect('approvals', '/manager')->name('approvals');
            Route::redirect('reports', '/manager/time/reports')->name('reports');
        });

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
