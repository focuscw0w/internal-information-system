<?php

namespace Modules\Project\Services;

use Illuminate\Validation\ValidationException;
use Modules\Project\Contracts\Repositories\TaskDependencyRepositoryInterface;
use Modules\Project\Contracts\TaskDependencyServiceInterface;
use Modules\Project\Models\Task;

class TaskDependencyService implements TaskDependencyServiceInterface
{
    public function __construct(private readonly TaskDependencyRepositoryInterface $dependencies) {}

    public function add(Task $task, int $predecessorId): void
    {
        $this->guardTaskNotStarted($task);
        $this->guardAgainstSelf($task, $predecessorId);

        $predecessor = $this->dependencies->findTaskOrFail($predecessorId);
        $this->guardSameProject($task, $predecessor);

        if ($this->wouldCreateCycle($task, $predecessorId)) {
            throw ValidationException::withMessages([
                'depends_on_task_id' => 'Pridanie tejto závislosti by vytvorilo cyklus.',
            ]);
        }

        $this->dependencies->attachPredecessor($task, $predecessorId);
    }

    public function remove(Task $task, int $predecessorId): void
    {
        $this->dependencies->detachPredecessor($task, $predecessorId);
    }

    public function sync(Task $task, array $predecessorIds): void
    {
        $this->guardTaskNotStarted($task);

        $predecessorIds = array_values(array_unique(array_map('intval', $predecessorIds)));

        foreach ($predecessorIds as $id) {
            $this->guardAgainstSelf($task, $id);
        }

        if (! empty($predecessorIds)) {
            $sameProjectCount = $this->dependencies->countSameProjectTasks($predecessorIds, $task->project_id);

            if ($sameProjectCount !== count($predecessorIds)) {
                throw ValidationException::withMessages([
                    'predecessor_ids' => 'Závislosti musia patriť do toho istého projektu.',
                ]);
            }
        }

        DB::transaction(function () use ($task, $predecessorIds) {
            $current = $this->dependencies->predecessorIds($task);
            $toAdd = array_diff($predecessorIds, $current);

            foreach ($toAdd as $newId) {
                if ($this->wouldCreateCycle($task, (int) $newId)) {
                    throw ValidationException::withMessages([
                        'predecessor_ids' => 'Niektorá z požadovaných závislostí by vytvorila cyklus.',
                    ]);
                }
            }

            $this->dependencies->syncPredecessors($task, $predecessorIds);
        });
    }

    public function wouldCreateCycle(Task $task, int $newPredecessorId): bool
    {
        if ($task->id === $newPredecessorId) {
            return true;
        }

        $maxIterations = max(1, $this->dependencies->countProjectTasks($task->project_id));

        $visited = [];
        $queue = [$newPredecessorId];
        $steps = 0;

        while (! empty($queue) && $steps < $maxIterations + 1) {
            $current = array_shift($queue);
            if ($current === $task->id) {
                return true;
            }

            if (isset($visited[$current])) {
                continue;
            }
            $visited[$current] = true;
            $steps++;

            $upstream = $this->dependencies->upstreamTaskIds((int) $current);

            foreach ($upstream as $up) {
                if (! isset($visited[$up])) {
                    $queue[] = (int) $up;
                }
            }
        }

        return false;
    }

    private function guardAgainstSelf(Task $task, int $predecessorId): void
    {
        if ($task->id === $predecessorId) {
            throw ValidationException::withMessages([
                'depends_on_task_id' => 'Úloha nemôže závisieť sama na sebe.',
            ]);
        }
    }

    private function guardSameProject(Task $task, Task $predecessor): void
    {
        if ($task->project_id !== $predecessor->project_id) {
            throw ValidationException::withMessages([
                'depends_on_task_id' => 'Závislosti sú možné len v rámci toho istého projektu.',
            ]);
        }
    }

    private function guardTaskNotStarted(Task $task): void
    {
        if ($task->status !== 'todo') {
            throw ValidationException::withMessages([
                'predecessor_ids' => 'Závislosti možno nastavovať len pre úlohy, ktoré ešte nezačali.',
                'depends_on_task_id' => 'Závislosti možno nastavovať len pre úlohy, ktoré ešte nezačali.',
            ]);
        }
    }
}
