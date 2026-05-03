import { Head } from '@inertiajs/react';
import { ProjectsOverview } from '../components/projects/projects-overview';
import ProjectLayout from '../layouts/project-layout';
import { Project } from '../types/types';

export default function Index({
    title,
    projects,
}: {
    title: string;
    projects: Project[];
}) {
    return (
        <ProjectLayout>
            <Head title={title} />
            <div className="p-6">
                <h1 className="text-2xl font-semibold">{title}</h1>
                <ProjectsOverview projects={projects} />
            </div>
        </ProjectLayout>
    );
}
