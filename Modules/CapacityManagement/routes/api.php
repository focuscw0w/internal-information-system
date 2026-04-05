<?php

use Illuminate\Support\Facades\Route;
use Modules\CapacityManagement\Http\Controllers\CapacityManagementController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('capacitymanagements', CapacityManagementController::class)->names('capacitymanagement');
});
