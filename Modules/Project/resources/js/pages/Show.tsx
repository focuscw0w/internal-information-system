import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function Index() {
    return (
        <AppLayout>
            <Head title="Detail" />
            <div className="p-6">
                <h1 className="text-2xl font-semibold">Detail projektu</h1>
            </div>
        </AppLayout>
    );
}
