<?php

namespace Modules\CapacityManagement\Contracts;

use Modules\CapacityManagement\DTO\SimulationInput;
use Modules\CapacityManagement\DTO\SimulationResult;

interface SimulationServiceInterface
{
    /**
     * Run a capacity simulation with the given input overrides.
     * Never persists anything to the database.
     */
    public function simulate(SimulationInput $input): SimulationResult;
}
