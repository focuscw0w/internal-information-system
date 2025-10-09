<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

/*
 * Dashboard - user must be authenticated
 */

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

/*
 * Pricing - user must be authenticated
 */

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('pricing', function () {
        return Inertia::render('pricing');
    })->name('pricing');
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
