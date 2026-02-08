import { router } from '@inertiajs/react';
import { CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { Project, ViewMode } from '../../types/project.types';
import { StatCard } from '../project-statcard';
import { ProjectCard } from './project-card';
import { ProjectHeader } from './project-header';
import { ProjectRow } from './project-row';

export const ProjectCapacityOverview = ({
    projects,
}: {
    projects: Project[];
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const handleProjectClick = (projectId: number) => {
        router.visit(`/project/${projectId}`);
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <ProjectHeader viewMode={viewMode} onViewModeChange={setViewMode} />

            {/* Súhrnné štatistiky */}
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    title="Aktívne projekty"
                    value={2}
                    icon={TrendingUp}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    title="Celkový tím"
                    value={12}
                    icon={Users}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    title="Priemerné vyťaženie"
                    value="58%"
                    icon={Clock}
                    iconColor="text-yellow-600"
                    iconBgColor="bg-yellow-100"
                />
                <StatCard
                    title="Dokončené úlohy"
                    value="29/74"
                    icon={CheckCircle2}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />
            </div>

            {/* Grid alebo List view */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={() => handleProjectClick(project.id)}
                        />
                    ))}
                </div>
            ) : (
                <div>
                    {projects.map((project) => (
                        <ProjectRow
                            key={project.id}
                            project={project}
                            onClick={() => handleProjectClick(project.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
