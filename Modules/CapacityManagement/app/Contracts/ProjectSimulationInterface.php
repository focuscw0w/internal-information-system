<?php

namespace Modules\CapacityManagement\Contracts;

use Modules\CapacityManagement\DTO\ProjectSimulationInput;
use Modules\CapacityManagement\DTO\ProjectSimulationResult;
use Modules\Project\Models\Project;

interface ProjectSimulationInterface
{
    public function simulate(Project $project, ProjectSimulationInput $input): ProjectSimulationResult;
}
