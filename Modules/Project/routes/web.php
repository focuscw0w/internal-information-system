<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Modules\Project\Http\Controllers\ProjectController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('projects', ProjectController::class)->names('project');
});

// Main page for Projects module
Route::middleware(['web'])->group(function () {
    Route::get('/projects', fn () => Inertia::render('Projects/Index'))
        ->name('projects.index');
});
