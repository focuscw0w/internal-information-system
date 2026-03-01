<?php

use Illuminate\Support\Facades\Route;
use Modules\TimeTracking\Http\Controllers\TimeTrackingController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('timetrackings', TimeTrackingController::class)->names('timetracking');
});
