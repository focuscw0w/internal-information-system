<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\UserController; 

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

// TODO: presunúť do user-modulu
Route::get('/users', [UserController::class, 'index']);

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
