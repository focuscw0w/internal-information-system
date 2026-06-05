import { getAvatarColor } from '@/lib/avatar-color';
import { Project } from '../../../types/types';
import { BadgeLabel } from '../../ui/badge';
import { TaskTable } from '../task-table/task-table';

interface ProjectOverviewProps {
    project: Project;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
    const permissions = project.current_user_permissions ?? [];
    const can = (permission: string) => permissions.includes(permission);

    return (
        <div className="grid-main-side">
            <div className="col gap-4">
                {can('view_tasks') && <TaskTable project={project} />}
            </div>

            <aside className="col gap-4">
                <section className="card">
                    <div className="card__head">
                        <h3 className="card__title">Detaily</h3>
                    </div>
                    <div className="card__body space-y-3">
                        <DetailRow
                            label="Klient"
                            value={project.owner?.name ?? 'Internal'}
                        />
                        <DetailRow
                            label="Vedúci"
                            value={project.owner?.name ?? 'Nepriradený'}
                        />
                        <DetailRow
                            label="Začiatok"
                            value={new Date(
                                project.start_date,
                            ).toLocaleDateString('sk-SK')}
                        />
                        <DetailRow
                            label="Deadline"
                            value={new Date(project.end_date).toLocaleDateString(
                                'sk-SK',
                            )}
                        />
                        <DetailRow
                            label="Veľkosť tímu"
                            value={`${project.team_size} ľudí`}
                        />
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">Stav</span>
                            <BadgeLabel type="status" value={project.status} />
                        </div>
                    </div>
                </section>

                <section className="card">
                    <div className="card__head">
                        <h3 className="card__title">Tím</h3>
                    </div>
                    <div className="card__body space-y-3">
                        {project.team.slice(0, 6).map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-3"
                            >
                                <span className={`avatar avatar--sm ${getAvatarColor(member.name)}`}>
                                    {member.name
                                        .split(' ')
                                        .map((part) => part[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {member.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Člen tímu
                                    </p>
                                </div>
                                {member.weekly_load_hours !== undefined &&
                                    member.weekly_capacity_hours !== undefined && (
                                        <span className="mono text-xs text-muted-foreground">
                                            {member.weekly_load_hours}h/
                                            {member.weekly_capacity_hours}h
                                        </span>
                                    )}
                            </div>
                        ))}
                    </div>
                </section>
            </aside>
        </div>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium text-foreground">
                {value}
            </span>
        </div>
    );
}
