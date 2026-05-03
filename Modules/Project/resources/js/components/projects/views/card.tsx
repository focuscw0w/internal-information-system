import { Calendar } from 'lucide-react';
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
    const avatarColors = [
        'bg-[var(--accent-blue)]',
        'bg-[#c0447c]',
        'bg-[#5b65d8]',
        'bg-[#009b72]',
        'bg-[#b36b00]',
    ];

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

            <div className="px-5 pt-4 pb-3">
                <CardHeader
                    eyebrow={project.owner?.name ?? 'Internal'}
                    name={project.name}
                    status={project.status}
                    workload={project.workload}
                    isAtRisk={project.is_at_risk}
                />

                <div>
                    <ProgressBar
                        label="Pokrok"
                        value={project.progress}
                        color={project.progress >= 100 ? 'bg-emerald-600' : 'bg-[var(--accent-blue)]'}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/50 px-5 py-3 text-xs text-muted-foreground">
                <div className="avatars min-w-0">
                    {visibleTeam.map((member, index) => (
                        <span
                            key={member.id}
                            className={`avatar avatar--sm ${avatarColors[index % avatarColors.length]}`}
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
                        <span className="avatar avatar--sm bg-muted text-muted-foreground">
                            +{extraTeam}
                        </span>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-5">
                    <span>
                        {project.tasks_completed}/{project.tasks_total}{' '}
                        úloh
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(project.end_date).toLocaleDateString(
                            'sk-SK',
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
};
