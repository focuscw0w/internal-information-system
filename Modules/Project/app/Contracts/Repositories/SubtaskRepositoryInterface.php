<?php

namespace Modules\Project\Contracts\Repositories;

use Modules\Project\Models\Subtask;

interface SubtaskRepositoryInterface
{
    public function maxSortOrderForTask(int $taskId): int;

    public function create(array $data): Subtask;

    public function findOrFail(int $subtaskId): Subtask;

    public function update(Subtask $subtask, array $data): bool;

    public function delete(Subtask $subtask): bool;

    public function fresh(Subtask $subtask): Subtask;
}
