import ManagerLayout from '@/layouts/ManagerLayout';
import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type Option = {
    id: number;
    name: string;
    email?: string | null;
};

type ReportData = {
    byUser: {
        user_id: number;
        user_name: string;
        total_hours: number;
        entries_count: number;
        projects_count: number;
    }[];
    byProject: {
        project_id: number;
        project_name: string;
        total_hours: number;
        entries_count: number;
        top_contributors: { user_id: number; name: string; hours: number }[];
    }[];
    timeline: {
        label: string;
        total_hours: number;
        entries_count: number;
    }[];
};

type Filters = {
    date_from: string;
    date_to: string;
    project_ids: number[];
    user_ids: number[];
    status: 'approved' | 'pending' | 'rejected' | 'all';
};

type Props = {
    filters: Filters;
    data: ReportData;
    filterOptions: {
        projects: Option[];
        users: Option[];
    };
};

type Tab = 'users' | 'projects' | 'timeline';

const formatHours = (hours: number) =>
    new Intl.NumberFormat('sk-SK', {
        maximumFractionDigits: 2,
    }).format(hours);

const buildParams = (filters: Filters, tab?: Tab) => {
    const params = new URLSearchParams();
    params.set('date_from', filters.date_from);
    params.set('date_to', filters.date_to);
    params.set('status', filters.status);
    if (filters.project_ids.length)
        params.set('project_ids', filters.project_ids.join(','));
    if (filters.user_ids.length)
        params.set('user_ids', filters.user_ids.join(','));
    if (tab) params.set('tab', tab);
    return params;
};

export default function Reports({ filters, data, filterOptions }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('users');
    const [filterState, setFilterState] = useState<Filters>(filters);
    const [reportData, setReportData] = useState<ReportData>(data);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setLoading(true);
            fetch(
                `/manager/time/reports/data?${buildParams(filterState).toString()}`,
                {
                    headers: { Accept: 'application/json' },
                },
            )
                .then((response) => response.json())
                .then((payload: ReportData) => setReportData(payload))
                .finally(() => setLoading(false));
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [filterState]);

    const totals = useMemo(() => {
        const hours = reportData.byUser.reduce(
            (sum, row) => sum + Number(row.total_hours),
            0,
        );
        const entries = reportData.byUser.reduce(
            (sum, row) => sum + Number(row.entries_count),
            0,
        );

        return { hours, entries };
    }, [reportData.byUser]);

    const activeTabRows = useMemo(() => {
        if (activeTab === 'projects') return reportData.byProject.length;
        if (activeTab === 'timeline') return reportData.timeline.length;
        return reportData.byUser.length;
    }, [activeTab, reportData]);

    const isExportDisabled = activeTabRows === 0;

    const exportCsv = () => {
        if (isExportDisabled) return;
        window.location.href = `/manager/time/reports/export?${buildParams(filterState, activeTab).toString()}`;
    };

    return (
        <ManagerLayout
            breadcrumbs={[
                { title: 'Manažér', href: '/manager' },
                { title: 'Time Reports', href: '/manager/time/reports' },
            ]}
        >
            <Head title="Time Reports" />
            <div className="page page-enter">
                <div className="page-head">
                    <div>
                        <h1 className="page-head__title">Time Reports</h1>
                        <p className="page-head__subtitle">
                            Agregácie hodín podľa ľudí, projektov a obdobia.
                        </p>
                    </div>
                    <div className="page-head__actions">
                        <button
                            type="button"
                            className="btn btn--primary"
                            onClick={exportCsv}
                            disabled={isExportDisabled}
                            title={
                                isExportDisabled
                                    ? 'Nie sú žiadne dáta na export'
                                    : undefined
                            }
                        >
                            <Download className="h-4 w-4" />
                            CSV
                        </button>
                    </div>
                </div>

                <div className="kpi-grid">
                    <div className="kpi">
                        <span className="kpi__label">Hodiny</span>
                        <span className="kpi__value">
                            {formatHours(totals.hours)}
                            <sub>h</sub>
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Záznamy</span>
                        <span className="kpi__value">{totals.entries}</span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Ľudia</span>
                        <span className="kpi__value">
                            {reportData.byUser.length}
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Projekty</span>
                        <span className="kpi__value">
                            {reportData.byProject.length}
                        </span>
                    </div>
                </div>

                <section className="card">
                    <div className="card__head">
                        <h3 className="card__title">Filtre</h3>
                        {loading ? (
                            <span className="text-xs text-muted-foreground">
                                Načítavam...
                            </span>
                        ) : null}
                    </div>
                    <div className="card__body grid gap-3 md:grid-cols-5">
                        <input
                            type="date"
                            className="input w-full"
                            value={filterState.date_from}
                            onChange={(event) =>
                                setFilterState((state) => ({
                                    ...state,
                                    date_from: event.target.value,
                                }))
                            }
                        />
                        <input
                            type="date"
                            className="input w-full"
                            value={filterState.date_to}
                            onChange={(event) =>
                                setFilterState((state) => ({
                                    ...state,
                                    date_to: event.target.value,
                                }))
                            }
                        />
                        <select
                            multiple
                            className="select h-24 w-full"
                            value={filterState.project_ids.map(String)}
                            onChange={(event) =>
                                setFilterState((state) => ({
                                    ...state,
                                    project_ids: Array.from(
                                        event.target.selectedOptions,
                                    ).map((option) => Number(option.value)),
                                }))
                            }
                        >
                            {filterOptions.projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                        <select
                            multiple
                            className="select h-24 w-full"
                            value={filterState.user_ids.map(String)}
                            onChange={(event) =>
                                setFilterState((state) => ({
                                    ...state,
                                    user_ids: Array.from(
                                        event.target.selectedOptions,
                                    ).map((option) => Number(option.value)),
                                }))
                            }
                        >
                            {filterOptions.users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="select w-full"
                            value={filterState.status}
                            onChange={(event) =>
                                setFilterState((state) => ({
                                    ...state,
                                    status: event.target
                                        .value as Filters['status'],
                                }))
                            }
                        >
                            <option value="approved">Schválené</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Zamietnuté</option>
                            <option value="all">Všetko</option>
                        </select>
                    </div>
                </section>

                <section className="card">
                    <div className="card__head">
                        <div className="tabs">
                            <button
                                type="button"
                                className={`tab ${activeTab === 'users' ? 'is-active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                Po osobe
                            </button>
                            <button
                                type="button"
                                className={`tab ${activeTab === 'projects' ? 'is-active' : ''}`}
                                onClick={() => setActiveTab('projects')}
                            >
                                Po projekte
                            </button>
                            <button
                                type="button"
                                className={`tab ${activeTab === 'timeline' ? 'is-active' : ''}`}
                                onClick={() => setActiveTab('timeline')}
                            >
                                Po období
                            </button>
                        </div>
                    </div>

                    {activeTab === 'users' && (
                        <UsersTable rows={reportData.byUser} />
                    )}
                    {activeTab === 'projects' && (
                        <ProjectsTable rows={reportData.byProject} />
                    )}
                    {activeTab === 'timeline' && (
                        <TimelineChart rows={reportData.timeline} />
                    )}
                </section>
            </div>
        </ManagerLayout>
    );
}

function UsersTable({ rows }: { rows: ReportData['byUser'] }) {
    return (
        <div className="overflow-x-auto">
            <table className="table">
                <thead>
                    <tr>
                        <th>Meno</th>
                        <th>Hodiny</th>
                        <th>Entries</th>
                        <th>Projekty</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.user_id}>
                            <td className="font-medium">{row.user_name}</td>
                            <td className="mono">
                                {formatHours(row.total_hours)} h
                            </td>
                            <td>{row.entries_count}</td>
                            <td>{row.projects_count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ProjectsTable({ rows }: { rows: ReportData['byProject'] }) {
    return (
        <div className="overflow-x-auto">
            <table className="table">
                <thead>
                    <tr>
                        <th>Projekt</th>
                        <th>Hodiny</th>
                        <th>Entries</th>
                        <th>Top prispievatelia</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.project_id}>
                            <td className="font-medium">{row.project_name}</td>
                            <td className="mono">
                                {formatHours(row.total_hours)} h
                            </td>
                            <td>{row.entries_count}</td>
                            <td>
                                <div className="flex flex-wrap gap-1">
                                    {row.top_contributors.map((contributor) => (
                                        <span
                                            key={contributor.user_id}
                                            className="badge badge--neutral"
                                        >
                                            {contributor.name} ·{' '}
                                            {formatHours(contributor.hours)} h
                                        </span>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function TimelineChart({ rows }: { rows: ReportData['timeline'] }) {
    return (
        <div className="card__body">
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip
                            formatter={(value) => [`${value} h`, 'Hodiny']}
                        />
                        <Bar
                            dataKey="total_hours"
                            fill="var(--accent-blue)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
