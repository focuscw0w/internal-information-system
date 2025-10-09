import AppLayout from '@/layouts/app-layout';
import { pricing } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pricing',
        href: pricing().url,
    },
];

export default function Pricing() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <h1>Pricing page</h1>
            </div>
        </AppLayout>
    );
}
