<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Http\Controllers\ProfileController;
use Modules\User\Http\Controllers\UserController;
use Modules\User\Http\Middleware\EnsureUserManagementAccess;

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'me'])->name('user.profile');

    // User management
    Route::prefix('users')
        ->name('user.')
        ->group(function () {
            Route::get('options', [UserController::class, 'options'])->name('options');

            Route::middleware(EnsureUserManagementAccess::class)->group(function () {
                Route::get('/', [UserController::class, 'manage'])->name('index');
                Route::post('/', [UserController::class, 'store'])->name('store');
                Route::get('/{user}', [ProfileController::class, 'show'])->name('show');
                Route::put('/{user}', [UserController::class, 'update'])->name('update');
                Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
            });
        });
});
