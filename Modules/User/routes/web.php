<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Http\Controllers\Auth\AuthenticatedSessionController;
use Modules\User\Http\Controllers\UserController;
use Modules\User\Http\Middleware\EnsureUserManagementAccess;

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::prefix('users')
        ->name('user.')
        ->group(function () {
            Route::get('options', [UserController::class, 'index'])->name('options');

            Route::middleware(EnsureUserManagementAccess::class)->group(function () {
                Route::get('/', [UserController::class, 'manage'])->name('index');
                Route::post('/', [UserController::class, 'store'])->name('store');
            });
        });
});
