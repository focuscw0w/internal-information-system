import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Project } from 'Modules/Project/resources/js/types/types';
import { TimeEntry } from '../types/types';
import { TimeEntryTable } from '../components/time-entry-table/time-entry-table';
import { BreadcrumbItem } from '@/types';

interface TimeEntryProps {
    project: Project;
    entries: TimeEntry[];
}

export default function TimeEntryPage({ project, entries }: TimeEntryProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Sledovanie času', href: '/time-tracking' },
        { title: project.name, href: `/projects/${project.id}/time-entries` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Sledovanie času – ${project.name}`} />
            <div className=" space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Sledovanie času
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {project.name}
                    </p>
                </div>

                <TimeEntryTable
                    project={project}
                    entries={entries}
                />
            </div>
        </AppLayout>
    );
}
