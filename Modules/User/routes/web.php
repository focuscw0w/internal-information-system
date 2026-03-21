<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Http\Controllers\UserController;
use Modules\User\Http\Middleware\EnsureUserManagementAccess;

Route::middleware(['web', 'auth'])
    ->prefix('users')
    ->name('user.')
    ->group(function () {
        Route::get('options', [UserController::class, 'index'])->name('options');

        Route::middleware(EnsureUserManagementAccess::class)->group(function () {
            Route::get('/', [UserController::class, 'manage'])->name('index');
            Route::post('/', [UserController::class, 'store'])->name('store');
            Route::get('/{user}', [UserController::class, 'show'])->name('show');
            Route::put('/{user}', [UserController::class, 'update'])->name('update');
            Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
        });
    });
