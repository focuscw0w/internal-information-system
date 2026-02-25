<?php

use Illuminate\Support\Facades\Route;
use Modules\Project\Http\Controllers\ProjectController;
use Modules\Project\Http\Controllers\TaskController;
use Modules\Project\Http\Controllers\SubtaskController;
use Modules\Project\Http\Controllers\TeamController;

Route::middleware(['web', 'auth'])
    ->prefix('projects')
    ->name('projects.')
    ->group(function () {
        // Projects
        Route::get('/', [ProjectController::class, 'index'])->name('projects');
        Route::post('/', [ProjectController::class, 'store'])->name('store');

        Route::middleware('check.project.permission:view_project')->group(function () {
            Route::get('/{id}', [ProjectController::class, 'show'])->name('project-detail');
        });

        Route::middleware('check.project.permission:edit_project')->group(function () {
            Route::put('/{id}', [ProjectController::class, 'update'])->name('update');
        });

        Route::middleware('check.project.permission:delete_project')->group(function () {
            Route::delete('/{id}', [ProjectController::class, 'destroy'])->name('destroy');
        });

        // Tasks
        Route::prefix('{id}/tasks')->name('tasks.')->group(function () {
            Route::middleware('check.project.permission:view_tasks')->group(function () {
                Route::get('/', [TaskController::class, 'index'])->name('index');
                Route::get('/{task}', [TaskController::class, 'show'])->name('show');
            });

            Route::middleware('check.project.permission:create_tasks')->group(function () {
                Route::get('/create', [TaskController::class, 'create'])->name('create');
                Route::post('/', [TaskController::class, 'store'])->name('store');
            });

            Route::middleware('check.project.permission:edit_tasks')->group(function () {
                Route::get('/{task}/edit', [TaskController::class, 'edit'])->name('edit');
                Route::put('/{task}', [TaskController::class, 'update'])->name('update');
                Route::patch('/{task}/status', [TaskController::class, 'updateStatus'])->name('update-status');
                Route::patch('/{task}/log-hours', [TaskController::class, 'logHours'])->name('log-hours');
            });

            Route::middleware('check.project.permission:assign_tasks')->group(function () {
                Route::post('/{task}/assign', [TaskController::class, 'assign'])->name('assign');
            });

            Route::middleware('check.project.permission:delete_tasks')->group(function () {
                Route::delete('/{task}', [TaskController::class, 'destroy'])->name('destroy');
            });

            // Subtasks
            Route::prefix('{task}/subtasks')->name('subtasks.')
                ->middleware('check.project.permission:edit_tasks')
                ->group(function () {
                    Route::post('/', [SubtaskController::class, 'store'])->name('store');
                    Route::put('/{subtask}', [SubtaskController::class, 'update'])->name('update');
                    Route::patch('/{subtask}/toggle', [SubtaskController::class, 'toggle'])->name('toggle');
                    Route::delete('/{subtask}', [SubtaskController::class, 'destroy'])->name('destroy');
                });
        });

        // Team management
        Route::middleware('check.project.permission:manage_team')->group(function () {
            Route::put('/{id}/team', [TeamController::class, 'updateTeam'])->name('team.update');
        });

        // AI estimate endpoint
        Route::post('/tasks/estimate-ai', [TaskController::class, 'estimateWithAI'])
            ->name('tasks.estimate-ai');
    });
