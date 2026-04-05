<?php

use Illuminate\Support\Facades\Route;
use Modules\CapacityManagement\Http\Controllers\CapacityManagementController;

Route::middleware(['web', 'auth'])->group(function () {
    Route::prefix('capacity-management')->name('capacity-management.')->group(function () {
        Route::get('/', [CapacityManagementController::class, 'index'])->name('index');
        Route::patch('/users/{userId}/capacity', [CapacityManagementController::class, 'updateCapacity'])->name('users.capacity.update');
    });
});
