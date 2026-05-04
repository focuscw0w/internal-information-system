import { Link } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';

export type ManagerProject = {
    id: number;
    name: string;
    status: string;
    progress: number;
    end_date: string | null;
    is_overdue: boolean;
    days_remaining: number;
    owner: {
        id: number | null;
        name: string;
    };
};

export function AtRiskProjectsCard({ projects }: { projects: ManagerProject[] }) {
    return (
        <section className="card">
            <div className="card__head">
                <div>
                    <h3 className="card__title">Rizikové projekty</h3>
                    <div className="card__sub">Projekty vyžadujúce pozornosť</div>
                </div>
                <ShieldAlert className="h-5 w-5 text-[var(--warning-text)]" />
            </div>
            <div className="card__body space-y-3">
                {projects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Žiadne rizikové projekty.</p>
                ) : (
                    projects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="block rounded-md border border-border px-3 py-3 hover:bg-muted"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="truncate text-sm font-medium">
                                    {project.name}
                                </span>
                                <span
                                    className={`badge ${project.is_overdue ? 'badge--danger' : 'badge--warning'}`}
                                >
                                    {project.is_overdue ? 'Overdue' : `${project.days_remaining} dní`}
                                </span>
                            </div>
                            <div className="progress mt-3">
                                <div
                                    className="progress__fill progress__fill--warning"
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
}
