<?php

use Illuminate\Support\Facades\Route;
use Modules\CapacityManagement\Http\Middleware\EnsureCanAccessManagerArea;
use Modules\TimeTracking\Http\Controllers\TimeTrackingController;
use Modules\TimeTracking\Http\Controllers\TimeEntryController;
use Modules\TimeTracking\Http\Controllers\TimeEntryApprovalController;
use Modules\TimeTracking\Http\Controllers\TimeReportController;

Route::middleware(['web', 'auth'])->group(function () {
    Route::prefix('manager/time')->name('manager.time.')->middleware(EnsureCanAccessManagerArea::class)->group(function () {
        Route::post('/approvals/bulk', [TimeEntryApprovalController::class, 'bulkApprove'])
            ->name('approvals.bulk');
        Route::post('/approvals/{id}/approve', [TimeEntryApprovalController::class, 'approve'])
            ->name('approvals.approve');
        Route::post('/approvals/{id}/reject', [TimeEntryApprovalController::class, 'reject'])
            ->name('approvals.reject');

        Route::get('/reports', [TimeReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/data', [TimeReportController::class, 'data'])->name('reports.data');
        Route::get('/reports/export', [TimeReportController::class, 'export'])->name('reports.export');
    });

    // TimeTracking dashboard
    Route::prefix('time-tracking')
        ->name('time-tracking.')
        ->group(function () {
            Route::get('/', [TimeTrackingController::class, 'index'])->name('index');
            Route::get('/export', [TimeTrackingController::class, 'export'])->name('export');
        });

    // Timer API
    Route::get('/api/timer/projects', [TimeEntryController::class, 'timerProjects'])
        ->name('timer.projects');


    // Time entries scoped to project
    Route::prefix('projects/{projectId}/time-entries')
        ->name('projects.time-entries.')
        ->middleware('check.project.permission:view_project')
        ->group(function () {
            Route::get('/', [TimeEntryController::class, 'index'])->name('index');
            Route::post('/', [TimeEntryController::class, 'store'])->name('store');
            Route::put('/{entryId}', [TimeEntryController::class, 'update'])->name('update');
            Route::delete('/{entryId}', [TimeEntryController::class, 'destroy'])->name('destroy');
        });
});
