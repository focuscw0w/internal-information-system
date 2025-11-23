<?php

use Modules\Project\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Editovanie projektu', function () {
    it('projekt sa úspešne upraví', function () {
        $project = Project::factory()->create();


    });
});
