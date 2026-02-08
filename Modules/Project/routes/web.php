<?php

use Illuminate\Support\Facades\Route;
use Modules\Project\Http\Controllers\ProjectController;

// TODO: pridať middleware na permissions
Route::middleware(['web', 'auth'])
    ->prefix('project')
    ->name('project.')
    ->group(function () {
        Route::get('/', [ProjectController::class, 'index'])->name('index');
        Route::get('/{id}', [ProjectController::class, 'show'])->name('show');
        Route::put('/{id}', [ProjectController::class, 'update'])->name('update');
        Route::post('/', [ProjectController::class, 'store'])->name('store');
        Route::delete('/{id}', [ProjectController::class, 'destroy'])->name('destroy');
    });
