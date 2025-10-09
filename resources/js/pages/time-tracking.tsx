import AppLayout from '@/layouts/app-layout';
import { timeTracking } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Time Tracking',
        href: timeTracking().url,
    },
];

export default function TimeTracking() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Time Tracking" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <h1>Time tracking page</h1>
            </div>
        </AppLayout>
    );
}
