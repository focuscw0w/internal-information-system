<?php

use Illuminate\Support\Facades\Route;
use Modules\Project\Http\Controllers\ProjectController;
use Modules\Projects\Http\Controllers\TaskController;

// TODO: pridať middleware na permissions
Route::middleware(['web', 'auth'])
    ->prefix('projects')
    ->name('projects.')
    ->group(function () {
        // Projects
        Route::get('/', [ProjectController::class, 'index'])->name('index');
        Route::get('/{id}', [ProjectController::class, 'show'])->name('show');
        Route::put('/{id}', [ProjectController::class, 'update'])->name('update');
        Route::post('/', [ProjectController::class, 'store'])->name('store');
        Route::delete('/{id}', [ProjectController::class, 'destroy'])->name('destroy');

        // Tasks
        Route::resource('tasks', TaskController::class);
        Route::post('tasks/{task}/assign', [TaskController::class, 'assign'])
            ->name('tasks.assign');
        Route::patch('tasks/{task}/status', [TaskController::class, 'updateStatus'])
            ->name('tasks.update-status');
        Route::post('/tasks/estimate-ai', [TaskController::class, 'estimateWithAI'])
            ->name('tasks.estimate-ai');
    });
