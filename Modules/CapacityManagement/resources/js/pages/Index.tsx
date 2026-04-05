import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

type Person = {
    id: number;
    name: string;
    email: string;
    weekly_capacity_hours: number;
    weekly_load_hours: number;
    weekly_utilization: number;
    monthly_load_hours: number;
    monthly_capacity_hours: number;
    monthly_utilization: number;
    free_capacity_hours: number;
    status: 'green' | 'orange' | 'red';
    is_over_capacity: boolean;
};

type DashboardData = {
    people: Person[];
    alerts: { id: number; name: string; weekly_utilization: number }[];
    free_people: Person[];
    weekly_overview: {
        capacity_hours: number;
        load_hours: number;
        utilization: number;
    };
    monthly_overview: {
        capacity_hours: number;
        load_hours: number;
        utilization: number;
    };
    prediction: {
        remaining_project_hours: number;
        available_hours_next_4_weeks: number;
        can_finish: boolean;
        confidence: number;
    };
    history: { week_label: string; load_hours: number; utilization: number }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Kapacitný dashboard', href: '/capacity-management' },
];

export default function Index({ dashboard }: { dashboard: DashboardData }) {
    const [capacities, setCapacities] = useState<Record<number, number>>({});

    const maxHistoryUtilization = useMemo(
        () => Math.max(...dashboard.history.map((w) => w.utilization), 1),
        [dashboard.history],
    );

    const statusClassMap: Record<Person['status'], string> = {
        green: 'bg-emerald-100 text-emerald-700',
        orange: 'bg-orange-100 text-orange-700',
        red: 'bg-red-100 text-red-700',
    };

    const updateCapacity = (event: FormEvent, userId: number) => {
        event.preventDefault();

        router.patch(`/capacity-management/users/${userId}/capacity`, {
            weekly_capacity_hours:
                capacities[userId] ??
                dashboard.people.find((person) => person.id === userId)
                    ?.weekly_capacity_hours ??
                40,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kapacitný dashboard" />

            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-semibold">Kapacitný manažment</h1>

                {dashboard.alerts.length > 0 && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
                        <p className="font-medium">
                            Automatické upozornenie: prekročená kapacita nad
                            100%.
                        </p>
                        <ul className="mt-2 list-inside list-disc text-sm">
                            {dashboard.alerts.map((alert) => (
                                <li key={alert.id}>
                                    {alert.name}: {alert.weekly_utilization}%
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <section className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-white p-4">
                        <h2 className="font-medium">Týždenný prehľad</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Zaťaženie: {dashboard.weekly_overview.load_hours}h /{' '}
                            {dashboard.weekly_overview.capacity_hours}h (
                            {dashboard.weekly_overview.utilization}%)
                        </p>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                        <h2 className="font-medium">Mesačný prehľad</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Zaťaženie: {dashboard.monthly_overview.load_hours}h
                            / {dashboard.monthly_overview.capacity_hours}h (
                            {dashboard.monthly_overview.utilization}%)
                        </p>
                    </div>
                </section>

                <section className="rounded-lg border bg-white p-4">
                    <h2 className="font-medium">
                        Predikcia dokončenia projektu
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Zostávajúca práca:{' '}
                        {dashboard.prediction.remaining_project_hours}h.
                        Dostupná kapacita najbližšie 4 týždne:{' '}
                        {dashboard.prediction.available_hours_next_4_weeks}h.
                    </p>
                    <p
                        className={`mt-2 text-sm font-medium ${dashboard.prediction.can_finish ? 'text-emerald-700' : 'text-red-700'}`}
                    >
                        {dashboard.prediction.can_finish
                            ? 'Tím pravdepodobne stihne projekt.'
                            : 'Riziko nestihnutia projektu pri aktuálnej kapacite.'}
                    </p>
                </section>

                <section className="rounded-lg border bg-white p-4">
                    <h2 className="mb-4 font-medium">Dashboard kapacít</h2>
                    <div className="space-y-3">
                        {dashboard.people.map((person) => (
                            <div
                                key={person.id}
                                className="rounded-md border p-3"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="font-medium">
                                            {person.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {person.email}
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded px-2 py-1 text-xs font-medium ${statusClassMap[person.status]}`}
                                    >
                                        {person.weekly_utilization}%
                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-gray-600">
                                    Týždeň: {person.weekly_load_hours}h /{' '}
                                    {person.weekly_capacity_hours}h | Mesiac:{' '}
                                    {person.monthly_load_hours}h /{' '}
                                    {person.monthly_capacity_hours}h
                                </p>

                                <form
                                    onSubmit={(event) =>
                                        updateCapacity(event, person.id)
                                    }
                                    className="mt-3 flex items-center gap-2"
                                >
                                    <label className="text-xs text-gray-500">
                                        Týždenná kapacita (h)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        className="w-24 rounded border px-2 py-1 text-sm"
                                        value={
                                            capacities[person.id] ??
                                            person.weekly_capacity_hours
                                        }
                                        onChange={(event) =>
                                            setCapacities((previous) => ({
                                                ...previous,
                                                [person.id]: Number(
                                                    event.target.value,
                                                ),
                                            }))
                                        }
                                    />
                                    <button
                                        type="submit"
                                        className="rounded bg-gray-900 px-3 py-1 text-xs text-white"
                                    >
                                        Uložiť
                                    </button>
                                </form>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-lg border bg-white p-4">
                    <h2 className="font-medium">
                        Ľudia s voľnou kapacitou (&lt; 80%)
                    </h2>
                    <ul className="mt-3 space-y-1 text-sm text-gray-700">
                        {dashboard.free_people.length === 0 && (
                            <li>Aktuálne nie je voľná kapacita.</li>
                        )}
                        {dashboard.free_people.map((person) => (
                            <li key={person.id}>
                                {person.name} — voľných{' '}
                                {person.free_capacity_hours}h
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-lg border bg-white p-4">
                    <h2 className="font-medium">
                        História využitia kapacity (12 týždňov)
                    </h2>
                    <div className="mt-3 space-y-2">
                        {dashboard.history.map((week) => (
                            <div key={week.week_label}>
                                <div className="mb-1 flex justify-between text-xs text-gray-600">
                                    <span>{week.week_label}</span>
                                    <span>{week.utilization}%</span>
                                </div>
                                <div className="h-2 rounded bg-gray-100">
                                    <div
                                        className="h-2 rounded bg-blue-500"
                                        style={{
                                            width: `${Math.min(100, (week.utilization / maxHistoryUtilization) * 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
