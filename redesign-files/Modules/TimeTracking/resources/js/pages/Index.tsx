import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import { Project } from 'Modules/Project/resources/js/types/types';
import { TimeEntry } from '../types/types';
import { WeeklyChart } from '../components/weekly-chart';
import { BreadcrumbItem } from '@/types';

interface IndexProps {
    projects: Project[];
    entries: TimeEntry[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sledovanie času', href: '/time-tracking' },
];

export default function Index({ projects, entries }: IndexProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sledovanie času" />
            <div className=" space-y-6 p-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Sledovanie času
                </h1>

                <WeeklyChart entries={entries} />

                {projects.length > 0 ? (
                    <div className="grid gap-4">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() =>
                                    router.visit(`/projects/${project.id}/time-entries`)
                                }
                                className="cursor-pointer rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-gray-900">
                                            {project.name}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {project.tasks_total} úloh
                                        </p>
                                    </div>
                                    <Clock className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Clock className="mb-3 h-12 w-12 text-gray-300" />
                        <p className="text-sm text-gray-500">
                            Žiadne projekty na sledovanie času.
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
