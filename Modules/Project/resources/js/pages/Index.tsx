import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { CapacityOverview } from '../components/index/capacity-overview';
import { Project } from '../types/types';

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
                <CapacityOverview projects={projects} />
            </div>
        </AppLayout>
    );
}
