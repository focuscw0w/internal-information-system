<?php

use Illuminate\Support\Facades\Route;
use Modules\Project\Http\Controllers\ProjectController;

Route::middleware(['web', 'auth', 'verified'])->group(function () {
    Route::resource('projects', ProjectController::class)
        ->only(['index', 'show', 'store'])
        ->names('project');
});
