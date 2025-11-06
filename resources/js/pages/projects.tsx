import AppLayout from '@/layouts/app-layout';
import { projects } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

import AddProjectModal from '@/features/projects/components/add-project-modal';
import ProjectItem from '@/features/projects/components/project-item';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Projects',
        href: projects().url,
    },
];

const testArr: number[] = [1, 2, 3, 4, 5, 6, 7];

export default function Projects() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />

            <AddProjectModal />

            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {testArr.map((index: number) => (
                    <ProjectItem id={index} key={index} />
                ))}
            </div>
        </AppLayout>
    );
}
