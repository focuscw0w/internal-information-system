<?php

namespace Modules\Project\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Project\Contracts\TaskDependencyServiceInterface;
use Modules\Project\Models\Task;

class TaskDependencyService implements TaskDependencyServiceInterface
{
    public function add(Task $task, int $predecessorId): void
    {
        $this->guardTaskNotStarted($task);
        $this->guardAgainstSelf($task, $predecessorId);

        $predecessor = Task::findOrFail($predecessorId);
        $this->guardSameProject($task, $predecessor);

        if ($this->wouldCreateCycle($task, $predecessorId)) {
            throw ValidationException::withMessages([
                'depends_on_task_id' => 'Pridanie tejto závislosti by vytvorilo cyklus.',
            ]);
        }

        $task->predecessors()->syncWithoutDetaching([$predecessorId]);
    }

    public function remove(Task $task, int $predecessorId): void
    {
        $task->predecessors()->detach($predecessorId);
    }

    public function sync(Task $task, array $predecessorIds): void
    {
        $this->guardTaskNotStarted($task);

        $predecessorIds = array_values(array_unique(array_map('intval', $predecessorIds)));

        foreach ($predecessorIds as $id) {
            $this->guardAgainstSelf($task, $id);
        }

        if (! empty($predecessorIds)) {
            $sameProjectCount = Task::whereIn('id', $predecessorIds)
                ->where('project_id', $task->project_id)
                ->count();

            if ($sameProjectCount !== count($predecessorIds)) {
                throw ValidationException::withMessages([
                    'predecessor_ids' => 'Závislosti musia patriť do toho istého projektu.',
                ]);
            }
        }

        DB::transaction(function () use ($task, $predecessorIds) {
            $current = $task->predecessors()->pluck('tasks.id')->all();
            $toAdd = array_diff($predecessorIds, $current);

            foreach ($toAdd as $newId) {
                if ($this->wouldCreateCycle($task, (int) $newId)) {
                    throw ValidationException::withMessages([
                        'predecessor_ids' => 'Niektorá z požadovaných závislostí by vytvorila cyklus.',
                    ]);
                }
            }

            $task->predecessors()->sync($predecessorIds);
        });
    }

    public function wouldCreateCycle(Task $task, int $newPredecessorId): bool
    {
        if ($task->id === $newPredecessorId) {
            return true;
        }

        $maxIterations = max(1, Task::where('project_id', $task->project_id)->count());

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

            $upstream = DB::table('task_dependencies')
                ->where('task_id', $current)
                ->pluck('depends_on_task_id')
                ->all();

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
