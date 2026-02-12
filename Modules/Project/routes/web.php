<?php

use Illuminate\Support\Facades\Route;
use Modules\Project\Http\Controllers\ProjectController;
use Modules\Project\Http\Controllers\TaskController;

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
        Route::prefix('{id}/tasks')->name('tasks.')->group(function () {
            Route::get('/', [TaskController::class, 'index'])->name('index');
            Route::get('/create', [TaskController::class, 'create'])->name('create');
            Route::post('/', [TaskController::class, 'store'])->name('store');
            Route::get('/{task}', [TaskController::class, 'show'])->name('show');
            Route::get('/{task}/edit', [TaskController::class, 'edit'])->name('edit');
            Route::put('/{task}', [TaskController::class, 'update'])->name('update');
            Route::delete('/{task}', [TaskController::class, 'destroy'])->name('destroy');
            Route::post('/{task}/assign', [TaskController::class, 'assign'])->name('assign');
            Route::patch('/{task}/status', [TaskController::class, 'updateStatus'])->name('update-status');
        });

        // Team management
        Route::put('/{id}/team', [ProjectController::class, 'updateTeam'])->name('team.update');

        // AI estimate endpoint
        Route::post('/tasks/estimate-ai', [TaskController::class, 'estimateWithAI'])
            ->name('tasks.estimate-ai');
    });
