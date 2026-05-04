import { Link } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';

export type ManagerTask = {
    id: number;
    project_id: number;
    title: string;
    due_date: string | null;
    priority: string;
    project: {
        id: number;
        name: string;
    };
};

export function OverdueTasksCard({ tasks }: { tasks: ManagerTask[] }) {
    return (
        <section className="card">
            <div className="card__head">
                <div>
                    <h3 className="card__title">Overdue úlohy</h3>
                    <div className="card__sub">Top položky v manažovaných projektoch</div>
                </div>
                <AlertTriangle className="h-5 w-5 text-[var(--danger-text)]" />
            </div>
            <div className="card__body space-y-2">
                {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Žiadne overdue úlohy.</p>
                ) : (
                    tasks.map((task) => (
                        <Link
                            key={task.id}
                            href={`/projects/${task.project_id}/tasks/${task.id}`}
                            className="block rounded-md border border-border px-3 py-2 hover:bg-muted"
                        >
                            <div className="truncate text-sm font-medium">
                                {task.title}
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span className="truncate">{task.project.name}</span>
                                <span className="mono">{task.due_date ?? '-'}</span>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
}
