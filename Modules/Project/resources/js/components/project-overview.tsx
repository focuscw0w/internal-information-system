import { CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { Project, ViewMode } from '../types/project.types';
import { ProjectCard } from './project-card';
import { ProjectHeader } from './project-header';
import { ProjectRow } from './project-row';
import { StatCard } from './project-statcard';

const ProjectsCapacityOverview = ({ projects }: { projects: Project[] }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const handleProjectClick = (projectId: number) => {
        console.log(`Navigate to project: ${projectId}`);
        // window.location.href = `/projects/${projectId}`;
    };

    const handleEditProject = (projectId: number) => {
        console.log(`Navigate to edit project: ${projectId}`);
        // window.location.href = `/projects/${projectId}/edit`;
    };

    const handleDeleteProject = (projectId: number) => {
        if (confirm('Naozaj chcete zmazať tento projekt?')) {
            console.log(`Delete project: ${projectId}`);
            // API call to delete project
        }
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

            {/* Projekty - Grid alebo List view */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={handleProjectClick}
                            onEdit={handleEditProject}
                            onDelete={handleDeleteProject}
                        />
                    ))}
                </div>
            ) : (
                <div>
                    {projects.map((project) => (
                        <ProjectRow
                            key={project.id}
                            project={project}
                            onClick={handleProjectClick}
                            onEdit={handleEditProject}
                            onDelete={handleDeleteProject}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectsCapacityOverview;
