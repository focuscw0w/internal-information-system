import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Project } from '../types/project.types';
import ProjectsCapacityOverview from '../components/index/project-overview';

export default function Index({
    title,
    projects,
}: {
    title: string;
    projects: Project[];
}) {
    return (
        <AppLayout>
            <Head title={title} />
            <div className="p-6">
                <h1 className="text-2xl font-semibold">{title}</h1>
                <ProjectsCapacityOverview projects={projects} />
            </div>
        </AppLayout>
    );
}
