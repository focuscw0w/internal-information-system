<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Modules\Project\Http\Controllers\ProjectController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('projects', ProjectController::class)->names('project');
});

Route::middleware(['web'])->group(function () {
    Route::get('/test', function () {
        return Inertia::render('test');
    });
});