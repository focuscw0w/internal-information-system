import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

import AddProjectModal from '../components/add-project-modal';
import ProjectItem from '../components/project-item';
import { Project } from '../types/Project';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Projects',
        href: "/projects",
    },
];

interface ProjectsProps {
    projects: Project[]
}

export default function Projects({ projects }: ProjectsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />

            <AddProjectModal />

            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {projects.map((project: Project) => (
                    <ProjectItem project={project} key={project.id} />
                ))}
            </div>
        </AppLayout>
    );
}
