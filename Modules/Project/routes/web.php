<?php

use Illuminate\Support\Facades\Route;
use Modules\Project\Http\Controllers\ProjectController;

Route::middleware(['web', 'auth'])
    ->prefix('project')
    ->name('project.')
    ->group(function () {
        Route::get('/', [ProjectController::class, 'index'])->name('index');
        Route::put('/{id}', [ProjectController::class, 'update'])->name('update');
        Route::post('/', [ProjectController::class, 'store'])->name('store');
    });
