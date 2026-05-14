<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Modules\User\Http\Controllers\ProfileController;
use Modules\User\Http\Controllers\Settings\MyProfileController;
use Modules\User\Http\Controllers\Settings\PasswordController;
use Modules\User\Http\Controllers\UserController;
use Modules\User\Http\Middleware\EnsureUserManagementAccess;

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'me'])->name('user.profile');

    // Personal settings
    Route::redirect('settings', '/settings/profile');
    Route::get('settings/profile', [MyProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [MyProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [MyProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('password.update');

    Route::get('settings/appearance', fn () => Inertia::render('User/settings/appearance'))
        ->name('appearance.edit');

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
