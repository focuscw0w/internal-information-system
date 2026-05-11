import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { GitBranch, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Project, Task, TaskStatus } from '../../types/types';

const STATUS_DOT: Record<TaskStatus, string> = {
    todo: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    testing: 'bg-amber-500',
    done: 'bg-green-500',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'Prebieha',
    testing: 'Testovanie',
    done: 'Hotovo',
};

interface DependenciesProps {
    task: Task;
    project: Project;
    canEdit: boolean;
}

export function Dependencies({ task, project, canEdit }: DependenciesProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const canManageDependencies = canEdit && task.status === 'todo';

    const initialIds = useMemo(
        () => new Set(task.predecessors?.map((p) => p.id) ?? []),
        [task.predecessors],
    );
    const [selected, setSelected] = useState<Set<number>>(initialIds);

    const candidates = useMemo(
        () =>
            project.tasks.filter(
                (t) =>
                    t.id !== task.id &&
                    t.title.toLowerCase().includes(search.toLowerCase()),
            ),
        [project.tasks, task.id, search],
    );

    const openDialog = () => {
        setSelected(new Set(initialIds));
        setSearch('');
        setOpen(true);
    };

    const toggle = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const submit = () => {
        router.put(
            `/projects/${project.id}/tasks/${task.id}/dependencies`,
            { predecessor_ids: Array.from(selected) },
            {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
            },
        );
    };

    const removeOne = (predecessorId: number) => {
        router.delete(
            `/projects/${project.id}/tasks/${task.id}/dependencies/${predecessorId}`,
            { preserveScroll: true },
        );
    };

    const predecessors = task.predecessors ?? [];

    return (
        <Card className="border-gray-100 shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <GitBranch className="h-5 w-5" />
                        Závislosti
                        {predecessors.length > 0 && (
                            <span className="text-sm font-normal text-gray-500">
                                ({predecessors.length})
                            </span>
                        )}
                    </CardTitle>
                    {canManageDependencies && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={openDialog}
                        >
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            Upraviť
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {canEdit && !canManageDependencies && (
                    <p className="mb-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                        Závislosti sa nastavujú pred začatím úlohy.
                    </p>
                )}

                {predecessors.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">
                        Úloha nemá žiadne predchádzajúce úlohy.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {predecessors.map((p) => (
                            <div
                                key={p.id}
                                className="flex items-center gap-2 rounded-full border border-gray-200 bg-card px-3 py-1.5 text-sm"
                            >
                                <span
                                    className={`h-2 w-2 rounded-full ${STATUS_DOT[p.status]}`}
                                    title={STATUS_LABEL[p.status]}
                                />
                                <span className="text-gray-700">{p.title}</span>
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={() => removeOne(p.id)}
                                        className="text-gray-400 hover:text-red-500"
                                        title="Odstrániť závislosť"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Vyberte predchádzajúce úlohy</DialogTitle>
                    </DialogHeader>

                    <input
                        type="text"
                        placeholder="Hľadať úlohu..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />

                    <div className="max-h-72 overflow-y-auto rounded-md border border-gray-100">
                        {candidates.length === 0 ? (
                            <p className="px-3 py-4 text-center text-xs text-gray-400">
                                Žiadne úlohy
                            </p>
                        ) : (
                            candidates.map((t) => (
                                <label
                                    key={t.id}
                                    className="flex cursor-pointer items-center gap-2 border-b border-gray-50 px-3 py-2 text-sm last:border-0 hover:bg-gray-50"
                                >
                                    <Checkbox
                                        checked={selected.has(t.id)}
                                        onCheckedChange={() => toggle(t.id)}
                                    />
                                    <span
                                        className={`h-2 w-2 rounded-full ${STATUS_DOT[t.status]}`}
                                    />
                                    <span className="text-gray-700">
                                        {t.title}
                                    </span>
                                </label>
                            ))
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Zrušiť
                        </Button>
                        <Button onClick={submit}>Uložiť</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
