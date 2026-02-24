import { router } from '@inertiajs/react';
import { CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { Project, ViewMode } from '../../types/types';
import { StatCard } from '../ui/statcard';
import { ProjectsHeader } from './projects-header';
import { Card } from './views/card';
import { Row } from './views/row';

interface ProjectsOverviewProps {
    projects: Project[];
}

export const ProjectsOverview = ({ projects }: ProjectsOverviewProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const handleProjectClick = (projectId: number) => {
        router.visit(`/projects/${projectId}`);
    };

    const activeProjects = projects.filter((p) => p.status === 'active').length;

    const totalTeam = projects.reduce((sum, p) => sum + p.team_size, 0);

    const avgCapacity =
        projects.length > 0
            ? Math.round(
                  projects.reduce((sum, p) => sum + p.capacity_used, 0) /
                      projects.length,
              )
            : 0;

    const tasksCompleted = projects.reduce(
        (sum, p) => sum + p.tasks_completed,
        0,
    );
    const tasksTotal = projects.reduce((sum, p) => sum + p.tasks_total, 0);

    return (
        <div className="min-h-screen">
            {/* Header */}
            <ProjectsHeader
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {/* Súhrnné štatistiky */}
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    title="Aktívne projekty"
                    value={activeProjects}
                    icon={TrendingUp}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    title="Celkový tím"
                    value={totalTeam}
                    icon={Users}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    title="Priemerné vyťaženie"
                    value={`${avgCapacity}%`}
                    icon={Clock}
                    iconColor="text-yellow-600"
                    iconBgColor="bg-yellow-100"
                />
                <StatCard
                    title="Dokončené úlohy"
                    value={`${tasksCompleted}/${tasksTotal}`}
                    icon={CheckCircle2}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />
            </div>

            {/* Grid alebo List view */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {projects.map((project) => (
                        <Card
                            key={project.id}
                            project={project}
                            onClick={() => handleProjectClick(project.id)}
                        />
                    ))}
                </div>
            ) : (
                <div>
                    {projects.map((project) => (
                        <Row
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
