import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type WeekPoint = { week_label: string; load_hours: number; utilization: number };

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
    history: WeekPoint[];
};

type ProjectPrediction = {
    id: number;
    name: string;
    remaining_hours: number;
    available_hours_next_4_weeks: number;
    can_finish: boolean;
    confidence: number;
    days_remaining: number;
    is_overdue: boolean;
};

type DashboardData = {
    people: Person[];
    alerts: { id: number; name: string; weekly_utilization: number }[];
    free_people: Person[];
    weekly_overview: { capacity_hours: number; load_hours: number; utilization: number };
    monthly_overview: { capacity_hours: number; load_hours: number; utilization: number };
    prediction: {
        remaining_project_hours: number;
        available_hours_next_4_weeks: number;
        can_finish: boolean;
        confidence: number;
        projects: ProjectPrediction[];
    };
    history: WeekPoint[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Kapacitný dashboard', href: '/capacity-management' }];

function utilizationColor(utilization: number): string {
    if (utilization >= 100) return '#ef4444';
    if (utilization >= 80) return '#f97316';
    return '#10b981';
}

function UtilizationBar({ utilization }: { utilization: number }) {
    const color = utilizationColor(utilization);
    const width = Math.min(100, utilization);
    return (
        <div className="mt-2 h-2 w-full rounded bg-gray-100">
            <div
                className="h-2 rounded transition-all"
                style={{ width: `${width}%`, backgroundColor: color }}
            />
        </div>
    );
}

function HistoryChart({ data, height = 160 }: { data: WeekPoint[]; height?: number }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week_label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 'auto']} />
                <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Využitie']}
                    labelFormatter={(label) => `Týždeň ${label}`}
                />
                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 2" label={{ value: '100%', fontSize: 10, fill: '#ef4444' }} />
                <ReferenceLine y={80} stroke="#f97316" strokeDasharray="4 2" label={{ value: '80%', fontSize: 10, fill: '#f97316' }} />
                <Area
                    type="monotone"
                    dataKey="utilization"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#histGrad)"
                    dot={false}
                    activeDot={{ r: 4 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export default function Index({
    dashboard,
    can_manage,
}: {
    dashboard: DashboardData;
    can_manage: boolean;
}) {
    const [capacities, setCapacities] = useState<Record<number, number>>({});
    const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});

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
                dashboard.people.find((p) => p.id === userId)?.weekly_capacity_hours ??
                40,
        });
    };

    const toggleHistory = (userId: number) => {
        setExpandedHistory((prev) => ({ ...prev, [userId]: !prev[userId] }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kapacitný dashboard" />

            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-semibold">Kapacitný manažment</h1>

                {/* Alerts */}
                {dashboard.alerts.length > 0 && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
                        <p className="font-medium">Automatické upozornenie: prekročená kapacita nad 100%.</p>
                        <ul className="mt-2 list-inside list-disc text-sm">
                            {dashboard.alerts.map((alert) => (
                                <li key={alert.id}>
                                    {alert.name}: {alert.weekly_utilization}%
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Team overview */}
                <section className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-white p-4">
                        <h2 className="font-medium">Týždenný prehľad</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Zaťaženie: {dashboard.weekly_overview.load_hours}h /{' '}
                            {dashboard.weekly_overview.capacity_hours}h (
                            {dashboard.weekly_overview.utilization}%)
                        </p>
                        <UtilizationBar utilization={dashboard.weekly_overview.utilization} />
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                        <h2 className="font-medium">Mesačný prehľad</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Zaťaženie: {dashboard.monthly_overview.load_hours}h /{' '}
                            {dashboard.monthly_overview.capacity_hours}h (
                            {dashboard.monthly_overview.utilization}%)
                        </p>
                        <UtilizationBar utilization={dashboard.monthly_overview.utilization} />
                    </div>
                </section>

                {/* Prediction */}
                <section className="rounded-lg border bg-white p-4">
                    <h2 className="mb-3 font-medium">Predikcia dokončenia projektu</h2>
                    <p className="text-sm text-gray-600">
                        Zostávajúca práca: <span className="font-medium">{dashboard.prediction.remaining_project_hours}h</span>.{' '}
                        Dostupná kapacita najbližšie 4 týždne:{' '}
                        <span className="font-medium">{dashboard.prediction.available_hours_next_4_weeks}h</span>.
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                        <p
                            className={`text-sm font-medium ${dashboard.prediction.can_finish ? 'text-emerald-700' : 'text-red-700'}`}
                        >
                            {dashboard.prediction.can_finish
                                ? 'Tím pravdepodobne stihne projekt.'
                                : 'Riziko nestihnutia projektu pri aktuálnej kapacite.'}
                        </p>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            Istota: {dashboard.prediction.confidence}%
                        </span>
                    </div>

                    {/* Per-project breakdown */}
                    {dashboard.prediction.projects.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-xs font-medium text-gray-500 uppercase">Rozpad po projektoch</p>
                            {dashboard.prediction.projects.map((proj) => (
                                <div key={proj.id} className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 text-sm">
                                    <div>
                                        <span className="font-medium">{proj.name}</span>
                                        {proj.is_overdue && (
                                            <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                                                Po termíne
                                            </span>
                                        )}
                                        {!proj.is_overdue && (
                                            <span className="ml-2 text-xs text-gray-400">
                                                {proj.days_remaining}d zostáva
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-gray-500">{proj.remaining_hours}h zostatok</span>
                                        <span
                                            className={`rounded px-1.5 py-0.5 font-medium ${proj.can_finish ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                                        >
                                            {proj.confidence}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Capacity cards */}
                <section className="rounded-lg border bg-white p-4">
                    <h2 className="mb-4 font-medium">Dashboard kapacít</h2>
                    <div className="space-y-3">
                        {dashboard.people.map((person) => (
                            <div key={person.id} className="rounded-md border p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="font-medium">{person.name}</p>
                                        <p className="text-xs text-gray-500">{person.email}</p>
                                    </div>
                                    <span
                                        className={`rounded px-2 py-1 text-xs font-medium ${statusClassMap[person.status]}`}
                                    >
                                        {person.weekly_utilization}%
                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-gray-600">
                                    Týždeň: {person.weekly_load_hours}h / {person.weekly_capacity_hours}h | Mesiac:{' '}
                                    {person.monthly_load_hours}h / {person.monthly_capacity_hours}h
                                </p>

                                {can_manage && (
                                    <form
                                        onSubmit={(event) => updateCapacity(event, person.id)}
                                        className="mt-3 flex items-center gap-2"
                                    >
                                        <label className="text-xs text-gray-500">Týždenná kapacita (h)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            className="w-24 rounded border px-2 py-1 text-sm"
                                            value={capacities[person.id] ?? person.weekly_capacity_hours}
                                            onChange={(event) =>
                                                setCapacities((prev) => ({
                                                    ...prev,
                                                    [person.id]: Number(event.target.value),
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
                                )}

                                {/* Individual history toggle */}
                                <button
                                    type="button"
                                    onClick={() => toggleHistory(person.id)}
                                    className="mt-2 text-xs text-indigo-600 hover:underline"
                                >
                                    {expandedHistory[person.id] ? 'Skryť históriu' : 'Zobraziť 12-týždenný trend'}
                                </button>

                                {expandedHistory[person.id] && person.history.length > 0 && (
                                    <div className="mt-3">
                                        <HistoryChart data={person.history} height={130} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Free people */}
                <section className="rounded-lg border bg-white p-4">
                    <h2 className="font-medium">Ľudia s voľnou kapacitou (&lt; 80%)</h2>
                    <ul className="mt-3 space-y-1 text-sm text-gray-700">
                        {dashboard.free_people.length === 0 && (
                            <li>Aktuálne nie je voľná kapacita.</li>
                        )}
                        {dashboard.free_people.map((person) => (
                            <li key={person.id}>
                                {person.name} — voľných {person.free_capacity_hours}h
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Team history chart */}
                <section className="rounded-lg border bg-white p-4">
                    <h2 className="mb-4 font-medium">História využitia kapacity tímu (12 týždňov)</h2>
                    <HistoryChart data={dashboard.history} height={200} />
                </section>
            </div>
        </AppLayout>
    );
}
