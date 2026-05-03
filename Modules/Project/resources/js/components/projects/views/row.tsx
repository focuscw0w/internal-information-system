import { AlertTriangle, Users } from 'lucide-react';
import { Project } from '../../../types/types';
import { BadgeLabel } from '../../ui/badge';
import { ProjectActions } from './project-actions';

interface RowProps {
    project: Project;
    onClick: () => void;
}

export const Row = ({ project, onClick }: RowProps) => {
    return (
        <div
            onClick={onClick}
            className="group cursor-pointer rounded-lg border border-border bg-card shadow-xs transition-shadow hover:shadow-sm"
        >
            <div className="p-4">
                <div className="flex items-center justify-between gap-6">
                    <div className="min-w-0 lg:flex-1">
                        <div className="mb-2 flex items-center gap-2">
                            <h3 className="text-base font-semibold text-foreground">
                                {project.name}
                            </h3>
                            {project.is_at_risk && (
                                <span title="Projekt je ohrozený" className="badge badge--danger">
                                    <AlertTriangle className="h-3 w-3" />
                                    Ohrozený
                                </span>
                            )}
                        </div>
                        <BadgeLabel type="status" value={project.status} />
                    </div>

                    <div className="hidden flex-1 lg:block">
                        <div className="mb-2 flex text-sm text-muted-foreground lg:justify-between">
                            <span>Progres</span>
                            <span className="font-medium text-foreground">
                                {project.progress}%
                            </span>
                        </div>
                        <div className="progress">
                            <div
                                className="progress__fill"
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="hidden flex-1 lg:block">
                        <div className="mb-2 flex text-sm text-muted-foreground lg:justify-between">
                            <span>Kapacita</span>
                            <span className="font-medium text-foreground">
                                {project.capacity_used}%
                            </span>
                        </div>
                        <div className="progress">
                            <div
                                className={`progress__fill ${
                                    project.capacity_used > 100
                                        ? 'progress__fill--danger'
                                        : project.capacity_used > 85
                                          ? 'progress__fill--warning'
                                          : ''
                                }`}
                                style={{ width: `${Math.min(project.capacity_used, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="hidden text-center sm:block">
                        <p className="mb-1 text-xs text-muted-foreground">Úlohy</p>
                        <p className="font-semibold text-foreground">
                            {project.tasks_completed}/{project.tasks_total}
                        </p>
                    </div>

                    <div className="hidden text-center sm:block">
                        <p className="mb-1 text-xs text-muted-foreground">Tím</p>
                        <div className="flex items-center justify-center gap-1 text-foreground">
                            <Users size={18} />
                            <span className="font-semibold">
                                {project.team_size}
                            </span>
                        </div>
                    </div>

                    <div className="w-24 text-center">
                        <p className="mb-1 text-xs text-muted-foreground">Zaťaženie</p>
                        <div className="flex items-center justify-center gap-1">
                            <BadgeLabel
                                type="workload"
                                value={project.workload}
                            />
                        </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()} className="w-24">
                        <ProjectActions project={project} />
                    </div>
                </div>
            </div>
        </div>
    );
};
