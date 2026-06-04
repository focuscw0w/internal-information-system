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
            <div className="page page-enter">
                <div className="page-head">
                    <div>
                        <h1 className="page-head__title">Evidencia času</h1>
                        <p className="page-head__subtitle">
                            {project.name}
                        </p>
                    </div>
                    <div className="page-head__actions">
                        <button type="button" className="btn" disabled>
                            Odoslať na schválenie
                        </button>
                    </div>
                </div>

                <TimeEntryTable
                    project={project}
                    entries={entries}
                />
            </div>
        </AppLayout>
    );
}
