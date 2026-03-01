<?php

use Illuminate\Support\Facades\Route;
use Modules\TimeTracking\Http\Controllers\TimeTrackingController;

Route::middleware(['web', 'auth'])
    ->prefix('time-tracking')
    ->name('time-tracking.')
    ->group(function () {
        Route::get('/', [TimeTrackingController::class, 'index'])->name('index');
    });
