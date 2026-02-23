<?php

namespace Modules\Project\Contracts;

use Modules\Project\Models\Subtask;

interface SubtaskServiceInterface
{
    public function createSubtask(int $taskId, array $data): Subtask;

    public function updateSubtask(int $subtaskId, array $data): Subtask;

    public function toggleSubtask(int $subtaskId): Subtask;

    public function deleteSubtask(int $subtaskId): bool;
}
