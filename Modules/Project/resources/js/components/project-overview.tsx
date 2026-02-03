import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react';
import React, { useState } from 'react';
import { Project, ViewMode } from '../types/project.types';
import { ProjectCard } from './project-card';
import { ProjectRow } from './project-row';
import { StatCard } from './project-statcard';
import { ViewModeToggle } from './project-viewmode-toggle';

const ProjectsCapacityOverview: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const projects: Project[] = [
        {
            id: 1,
            name: 'Redizajn e-shopu',
            status: 'active',
            progress: 65,
            startDate: '2024-01-15',
            endDate: '2024-04-30',
            teamSize: 5,
            tasksTotal: 24,
            tasksCompleted: 16,
            capacityUsed: 78,
            capacityAvailable: 22,
            workload: 'high',
            team: [
                { name: 'Ján Novák', role: 'Frontend Dev', allocation: 100 },
                { name: 'Petra Kovács', role: 'UX Designer', allocation: 80 },
                { name: 'Martin Szabó', role: 'Backend Dev', allocation: 60 },
            ],
        },
        {
            id: 2,
            name: 'Mobilná aplikácia',
            status: 'active',
            progress: 35,
            startDate: '2024-02-01',
            endDate: '2024-06-15',
            teamSize: 4,
            tasksTotal: 32,
            tasksCompleted: 11,
            capacityUsed: 45,
            capacityAvailable: 55,
            workload: 'medium',
            team: [
                { name: 'Lucia Horváth', role: 'Mobile Dev', allocation: 100 },
                { name: 'Tomáš Varga', role: 'QA Engineer', allocation: 50 },
            ],
        },
        {
            id: 3,
            name: 'API Integrácia',
            status: 'planning',
            progress: 10,
            startDate: '2024-03-01',
            endDate: '2024-05-30',
            teamSize: 3,
            tasksTotal: 18,
            tasksCompleted: 2,
            capacityUsed: 25,
            capacityAvailable: 75,
            workload: 'low',
            team: [
                { name: 'Peter Molnár', role: 'Backend Dev', allocation: 40 },
            ],
        },
    ];

    const handleProjectClick = (projectId: number) => {
        console.log(`Navigate to project: ${projectId}`);
        // window.location.href = `/projects/${projectId}`;
    };

    const handleCreateProject = () => {
        console.log('Navigate to create project');
        // window.location.href = '/projects/create';
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
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <p className="text-gray-600">
                        Prehľad projektov, zdrojov a vyťaženia tímu
                    </p>

                    <div className="flex items-center gap-6">
                        <Button
                            onClick={handleCreateProject}
                            variant="default"
                            size="lg"
                        >
                            Nový projekt
                        </Button>
                        <ViewModeToggle
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                        />
                    </div>
                </div>
            </div>

            {/* Súhrnné štatistiky */}
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
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
