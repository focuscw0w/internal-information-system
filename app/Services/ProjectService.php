<?php

namespace App\Services;

use App\Models\Project;

class ProjectService
{
    public function create(): Project {
        return new Project();
    }
}
