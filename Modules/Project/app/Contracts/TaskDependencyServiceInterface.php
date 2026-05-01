<?php

namespace Modules\Project\Contracts;

use Modules\Project\Models\Task;

interface TaskDependencyServiceInterface
{
    public function add(Task $task, int $predecessorId): void;

    public function remove(Task $task, int $predecessorId): void;

    public function sync(Task $task, array $predecessorIds): void;

    public function wouldCreateCycle(Task $task, int $newPredecessorId): bool;
}
