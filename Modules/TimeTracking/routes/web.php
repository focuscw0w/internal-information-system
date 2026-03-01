<?php

use Illuminate\Support\Facades\Route;
use Modules\TimeTracking\Http\Controllers\TimeTrackingController;
use Modules\TimeTracking\Http\Controllers\TimeEntryController;

Route::middleware(['web', 'auth'])->group(function () {
    // TimeTracking dashboard
    Route::prefix('time-tracking')
        ->name('time-tracking.')
        ->group(function () {
            Route::get('/', [TimeTrackingController::class, 'index'])->name('index');
        });

    // Time entries scoped to project
    Route::prefix('projects/{projectId}/time-entries')
        ->name('projects.time-entries.')
        ->group(function () {
            Route::get('/', [TimeEntryController::class, 'index'])->name('index');
            Route::post('/', [TimeEntryController::class, 'store'])->name('store');
            Route::put('/{entryId}', [TimeEntryController::class, 'update'])->name('update');
            Route::delete('/{entryId}', [TimeEntryController::class, 'destroy'])->name('destroy');
        });
});
