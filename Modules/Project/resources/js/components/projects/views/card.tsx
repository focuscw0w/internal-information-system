import { Project } from '../../../types/types';
import { ProgressBar } from '../progressbar';
import { ProjectActions } from './project-actions';
import { CardHeader } from './card-header';

interface CardProps {
    project: Project;
    onClick: () => void;
}

export const Card = ({ project, onClick }: CardProps) => {
    const visibleTeam = project.team?.slice(0, 4) ?? [];
    const extraTeam = Math.max(0, (project.team?.length ?? 0) - visibleTeam.length);

    return (
        <div
            onClick={onClick}
            className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-xs transition-shadow hover:shadow-sm"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-4 right-4 z-10"
            >
                <ProjectActions project={project} />
            </div>

            <div className="p-4">
                <CardHeader
                    name={project.name}
                    status={project.status}
                    workload={project.workload}
                    isAtRisk={project.is_at_risk}
                />

                <div className="mb-4">
                    <ProgressBar
                        label="Pokrok"
                        value={project.progress}
                        color={project.progress >= 100 ? 'bg-emerald-600' : 'bg-[var(--accent-blue)]'}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
                <div className="flex min-w-0 items-center">
                    {visibleTeam.map((member) => (
                        <span
                            key={member.id}
                            className="-ml-1 first:ml-0 inline-grid size-5 place-items-center rounded-full border border-card bg-[var(--accent-blue)] text-[9px] font-semibold text-white"
                            title={member.name}
                        >
                            {member.name
                                .split(' ')
                                .map((part) => part[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                        </span>
                    ))}
                    {extraTeam > 0 && (
                        <span className="-ml-1 inline-grid size-5 place-items-center rounded-full border border-card bg-muted text-[9px] font-semibold text-muted-foreground">
                            +{extraTeam}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-5">
                    <span>
                        {project.tasks_completed}/{project.tasks_total}{' '}
                        úloh
                    </span>
                    <span>
                        {new Date(project.end_date).toLocaleDateString(
                            'sk-SK',
                        )}
                            </span>
                </div>
            </div>
        </div>
    );
};
