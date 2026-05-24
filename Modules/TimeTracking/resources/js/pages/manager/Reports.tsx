import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { MultiSelect } from '@/components/ui/multi-select';
import ManagerLayout from '@/layouts/ManagerLayout';
import { Head } from '@inertiajs/react';
import {
    Briefcase,
    Calendar,
    Search,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
    previous_period_hours: number;
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

const STATUS_OPTIONS: { value: Filters['status']; label: string }[] = [
    { value: 'approved', label: 'Schválené' },
    { value: 'pending', label: 'Čaká na schválenie' },
    { value: 'rejected', label: 'Zamietnuté' },
    { value: 'all', label: 'Všetky stavy' },
];

const formatHours = (hours: number) =>
    new Intl.NumberFormat('sk-SK', {
        maximumFractionDigits: 1,
    }).format(hours);

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

const buildParams = (filters: Filters) => {
    const params = new URLSearchParams();
    params.set('date_from', filters.date_from);
    params.set('date_to', filters.date_to);
    params.set('status', filters.status);
    if (filters.project_ids.length)
        params.set('project_ids', filters.project_ids.join(','));
    if (filters.user_ids.length)
        params.set('user_ids', filters.user_ids.join(','));
    return params;
};

export default function Reports({ filters, data, filterOptions }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('users');
    const [filterState, setFilterState] = useState<Filters>(filters);
    const [reportData, setReportData] = useState<ReportData>(data);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

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

    const periodDays = useMemo(() => {
        const from = new Date(filterState.date_from);
        const to = new Date(filterState.date_to);
        const diff = Math.round(
            (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
        );
        return Math.max(diff + 1, 1);
    }, [filterState.date_from, filterState.date_to]);

    const delta = useMemo(() => {
        const prev = reportData.previous_period_hours;
        if (!prev || prev <= 0) return null;
        const pct = ((totals.hours - prev) / prev) * 100;
        return pct;
    }, [reportData.previous_period_hours, totals.hours]);

    const presets = useMemo(() => {
        const today = new Date();
        const todayStr = formatDate(today);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        const lastWeekStart = new Date(startOfWeek);
        lastWeekStart.setDate(startOfWeek.getDate() - 7);
        const lastWeekEnd = new Date(startOfWeek);
        lastWeekEnd.setDate(startOfWeek.getDate() - 1);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const thirtyAgo = new Date(today);
        thirtyAgo.setDate(today.getDate() - 29);
        const quarter = Math.floor(today.getMonth() / 3);
        const qStart = new Date(today.getFullYear(), quarter * 3, 1);
        const qEnd = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        return [
            {
                label: 'Tento týždeň',
                from: formatDate(startOfWeek),
                to: todayStr,
            },
            {
                label: 'Minulý týždeň',
                from: formatDate(lastWeekStart),
                to: formatDate(lastWeekEnd),
            },
            {
                label: 'Tento mesiac',
                from: formatDate(startOfMonth),
                to: todayStr,
            },
            {
                label: 'Posledných 30 dní',
                from: formatDate(thirtyAgo),
                to: todayStr,
            },
            {
                label: 'Tento kvartál',
                from: formatDate(qStart),
                to: formatDate(qEnd),
            },
        ];
    }, []);

    const projectOptions = useMemo(
        () =>
            filterOptions.projects.map((project) => ({
                id: project.id,
                name: project.name,
            })),
        [filterOptions.projects],
    );

    const userOptions = useMemo(
        () =>
            filterOptions.users.map((user) => ({
                id: user.id,
                name: user.name,
            })),
        [filterOptions.users],
    );

    const filteredUsers = reportData.byUser.filter(
        (row) =>
            !search ||
            row.user_name.toLowerCase().includes(search.toLowerCase()),
    );
    const filteredProjects = reportData.byProject.filter(
        (row) =>
            !search ||
            row.project_name.toLowerCase().includes(search.toLowerCase()),
    );

    const hasFilters =
        filterState.project_ids.length > 0 ||
        filterState.user_ids.length > 0 ||
        filterState.status !== 'approved' ||
        search.length > 0;

    const clearFilters = () => {
        setFilterState((state) => ({
            ...state,
            project_ids: [],
            user_ids: [],
            status: 'approved',
        }));
        setSearch('');
    };

    return (
        <ManagerLayout
            breadcrumbs={[
                { title: 'Manažér', href: '/manager' },
                { title: 'Výkazy času', href: '/manager/time/reports' },
            ]}
        >
            <Head title="Výkazy času" />
            <div className="page page-enter">
                <div className="page-head">
                    <div>
                        <h1 className="page-head__title">Výkazy času</h1>
                        <p className="page-head__subtitle">
                            Agregácie hodín podľa ľudí, projektov a obdobia.
                            Vyber rozsah a filtre.
                        </p>
                    </div>
                </div>

                <div className="kpi-grid">
                    <div className="kpi">
                        <span className="kpi__label">Hodiny spolu</span>
                        <span className="kpi__value">
                            {formatHours(totals.hours)}
                            <sub>h</sub>
                        </span>
                        {delta === null ? (
                            <span className="kpi__delta kpi__delta--neutral">
                                aktuálne obdobie
                            </span>
                        ) : (
                            <span
                                className={`kpi__delta ${
                                    delta > 0
                                        ? 'kpi__delta--up'
                                        : delta < 0
                                          ? 'kpi__delta--down'
                                          : 'kpi__delta--neutral'
                                }`}
                            >
                                {delta > 0 ? '+' : ''}
                                {delta.toFixed(0)}% vs minulé obdobie
                            </span>
                        )}
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Záznamy</span>
                        <span className="kpi__value">{totals.entries}</span>
                        <span className="kpi__delta kpi__delta--neutral">
                            {reportData.byUser.length > 0
                                ? `priemer ${(totals.entries / reportData.byUser.length).toFixed(1)} / osoba`
                                : 'žiadne záznamy'}
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Ľudia</span>
                        <span className="kpi__value">
                            {reportData.byUser.length}
                        </span>
                        <span className="kpi__delta kpi__delta--neutral">
                            aktívnych v období
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Projekty</span>
                        <span className="kpi__value">
                            {reportData.byProject.length}
                        </span>
                        <span className="kpi__delta kpi__delta--neutral">
                            s aspoň 1 záznamom
                        </span>
                    </div>
                </div>

                <section className="card mb-5">
                    <div className="card__body flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="min-w-20 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                                Obdobie
                            </span>
                            <div className="field-wrap">
                                <Calendar />
                                <input
                                    type="date"
                                    className="input input--with-icon w-40"
                                    value={filterState.date_from}
                                    onChange={(event) =>
                                        setFilterState((state) => ({
                                            ...state,
                                            date_from: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <span className="text-muted-foreground">–</span>
                            <div className="field-wrap">
                                <Calendar />
                                <input
                                    type="date"
                                    className="input input--with-icon w-40"
                                    value={filterState.date_to}
                                    onChange={(event) =>
                                        setFilterState((state) => ({
                                            ...state,
                                            date_to: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="mx-1 h-6 w-px bg-border" />
                            <div className="flex flex-wrap gap-1">
                                {presets.map((preset) => {
                                    const active =
                                        filterState.date_from === preset.from &&
                                        filterState.date_to === preset.to;
                                    return (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            className={`btn btn--sm ${active ? '' : 'btn--ghost'}`}
                                            onClick={() =>
                                                setFilterState((state) => ({
                                                    ...state,
                                                    date_from: preset.from,
                                                    date_to: preset.to,
                                                }))
                                            }
                                        >
                                            {preset.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="min-w-20 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                                Filtre
                            </span>
                            <MultiSelect
                                placeholder="Všetky projekty"
                                options={projectOptions}
                                value={filterState.project_ids}
                                onChange={(value) =>
                                    setFilterState((state) => ({
                                        ...state,
                                        project_ids: value,
                                    }))
                                }
                                icon={
                                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                }
                            />
                            <MultiSelect
                                placeholder="Všetci ľudia"
                                options={userOptions}
                                value={filterState.user_ids}
                                onChange={(value) =>
                                    setFilterState((state) => ({
                                        ...state,
                                        user_ids: value,
                                    }))
                                }
                                icon={
                                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                }
                            />
                            <select
                                className="select"
                                value={filterState.status}
                                onChange={(event) =>
                                    setFilterState((state) => ({
                                        ...state,
                                        status: event.target
                                            .value as Filters['status'],
                                    }))
                                }
                            >
                                {STATUS_OPTIONS.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <div className="field-wrap min-w-[200px] max-w-[280px] flex-1">
                                <Search />
                                <input
                                    type="search"
                                    className="input input--with-icon w-full"
                                    placeholder="Hľadať v tabuľke…"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                />
                            </div>
                            {hasFilters && (
                                <button
                                    type="button"
                                    className="btn btn--sm btn--ghost"
                                    onClick={clearFilters}
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Vyčistiť
                                </button>
                            )}
                            {loading && (
                                <span className="text-xs text-muted-foreground">
                                    Načítavam…
                                </span>
                            )}
                        </div>
                    </div>
                </section>

                <section className="card">
                    <div className="card__head !border-0 !p-0">
                        <div className="tabbar w-full border-b border-border">
                            <button
                                type="button"
                                className={`tab ${activeTab === 'users' ? 'is-active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                <Users className="h-4 w-4" />
                                Po osobe
                                <span className="tab__count">
                                    {reportData.byUser.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                className={`tab ${activeTab === 'projects' ? 'is-active' : ''}`}
                                onClick={() => setActiveTab('projects')}
                            >
                                <Briefcase className="h-4 w-4" />
                                Po projekte
                                <span className="tab__count">
                                    {reportData.byProject.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                className={`tab ${activeTab === 'timeline' ? 'is-active' : ''}`}
                                onClick={() => setActiveTab('timeline')}
                            >
                                <TrendingUp className="h-4 w-4" />
                                Po období
                                <span className="tab__count">
                                    {reportData.timeline.length}
                                </span>
                            </button>
                        </div>
                    </div>

                    {activeTab === 'users' && (
                        <UsersReportTable
                            rows={filteredUsers}
                            total={totals.hours}
                            periodDays={periodDays}
                        />
                    )}
                    {activeTab === 'projects' && (
                        <ProjectsReportTable
                            rows={filteredProjects}
                            total={totals.hours}
                        />
                    )}
                    {activeTab === 'timeline' && (
                        <TimelineSection rows={reportData.timeline} />
                    )}
                </section>
            </div>
        </ManagerLayout>
    );
}

function UsersReportTable({
    rows,
    total,
    periodDays,
}: {
    rows: ReportData['byUser'];
    total: number;
    periodDays: number;
}) {
    if (rows.length === 0) {
        return <EmptyState message="Pre zvolené obdobie a filtre nie sú žiadne dáta." />;
    }

    return (
        <div className="overflow-x-auto">
            <table className="table [&_thead_th]:py-4">
                <thead>
                    <tr>
                        <th>Osoba</th>
                        <th>Vyťaženie</th>
                        <th className="text-right">Hodiny</th>
                        <th className="text-right">Záznamy</th>
                        <th className="text-right">Projekty</th>
                        <th className="text-right">Priemer / deň</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const share = total > 0 ? (row.total_hours / total) * 100 : 0;
                        return (
                            <tr key={row.user_id}>
                                <td>
                                    <div className="flex items-center gap-2.5">
                                        <Avatar className="size-6">
                                            <AvatarFallback className="bg-muted text-[10px] font-semibold text-foreground">
                                                {initials(row.user_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">
                                            {row.user_name}
                                        </span>
                                    </div>
                                </td>
                                <td className="w-56">
                                    <div className="flex items-center gap-2.5">
                                        <Progress
                                            value={Math.min(share, 100)}
                                            className="flex-1"
                                        />
                                        <span className="mono min-w-9 text-right text-[11px] text-muted-foreground">
                                            {share.toFixed(1)}%
                                        </span>
                                    </div>
                                </td>
                                <td className="mono text-right font-medium">
                                    {formatHours(row.total_hours)} h
                                </td>
                                <td className="mono text-right text-muted-foreground">
                                    {row.entries_count}
                                </td>
                                <td className="mono text-right text-muted-foreground">
                                    {row.projects_count}
                                </td>
                                <td className="mono text-right text-muted-foreground">
                                    {formatHours(row.total_hours / periodDays)} h
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function ProjectsReportTable({
    rows,
    total,
}: {
    rows: ReportData['byProject'];
    total: number;
}) {
    if (rows.length === 0) {
        return <EmptyState message="Pre zvolené obdobie a filtre nie sú žiadne dáta." />;
    }

    return (
        <div className="overflow-x-auto">
            <table className="table [&_thead_th]:py-4">
                <thead>
                    <tr>
                        <th>Projekt</th>
                        <th>Vyťaženie</th>
                        <th className="text-right">Hodiny</th>
                        <th className="text-right">Záznamy</th>
                        <th>Top prispievatelia</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const share = total > 0 ? (row.total_hours / total) * 100 : 0;
                        const visible = row.top_contributors.slice(0, 4);
                        const more = row.top_contributors.length - visible.length;
                        return (
                            <tr key={row.project_id}>
                                <td className="font-medium">
                                    {row.project_name}
                                </td>
                                <td className="w-56">
                                    <div className="flex items-center gap-2.5">
                                        <Progress
                                            value={Math.min(share, 100)}
                                            className="flex-1"
                                        />
                                        <span className="mono min-w-9 text-right text-[11px] text-muted-foreground">
                                            {share.toFixed(1)}%
                                        </span>
                                    </div>
                                </td>
                                <td className="mono text-right font-medium">
                                    {formatHours(row.total_hours)} h
                                </td>
                                <td className="mono text-right text-muted-foreground">
                                    {row.entries_count}
                                </td>
                                <td>
                                    <div className="flex flex-wrap items-center gap-1">
                                        {visible.map((contributor) => (
                                            <span
                                                key={contributor.user_id}
                                                className="badge badge--neutral text-[11px]"
                                            >
                                                <Avatar className="size-3.5">
                                                    <AvatarFallback className="bg-muted text-[8px] font-semibold text-foreground">
                                                        {initials(contributor.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {contributor.name} ·{' '}
                                                {formatHours(contributor.hours)} h
                                            </span>
                                        ))}
                                        {more > 0 && (
                                            <span className="px-1 text-[11px] text-muted-foreground">
                                                +{more}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function TimelineSection({ rows }: { rows: ReportData['timeline'] }) {
    if (rows.length === 0) {
        return <EmptyState message="V zvolenom období neboli zaznamenané žiadne hodiny." />;
    }

    const max = Math.max(...rows.map((row) => row.total_hours), 1);

    return (
        <div className="px-4 py-5">
            <div className="mb-2 flex items-end justify-between">
                <div>
                    <h4 className="text-sm font-semibold">Hodiny v čase</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Súčet zaznamenaných hodín ({rows.length} období)
                    </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2.5 rounded-sm bg-[var(--accent-blue)]" />
                    Hodiny
                </div>
            </div>

            <div className="relative h-80 pt-3 pb-8 pl-14 pr-2">
                <div className="absolute top-3 bottom-8 left-0 flex w-12 flex-col justify-between pr-2 text-right font-mono text-[10.5px] text-muted-foreground">
                    <span>{Math.round(max)} h</span>
                    <span>{Math.round(max * 0.75)} h</span>
                    <span>{Math.round(max * 0.5)} h</span>
                    <span>{Math.round(max * 0.25)} h</span>
                    <span>0 h</span>
                </div>

                <div className="relative h-full">
                    {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                        <div
                            key={p}
                            className="absolute right-0 left-0 border-t border-dashed border-border"
                            style={{ bottom: `${p * 100}%` }}
                        />
                    ))}

                    <div className="absolute inset-0 flex items-end gap-0 px-1">
                        {rows.map((row) => {
                            const heightPct = (row.total_hours / max) * 100;
                            return (
                                <div
                                    key={row.label}
                                    className="relative flex h-full flex-1 flex-col items-center justify-end"
                                >
                                    <div
                                        className="relative w-[70%] max-w-14"
                                        style={{ height: `${heightPct}%` }}
                                    >
                                        <div className="absolute inset-0 rounded-t bg-[var(--accent-blue)] transition-all" />
                                        <div className="mono absolute bottom-full left-1/2 mb-1 -translate-x-1/2 text-[10.5px] font-medium whitespace-nowrap text-muted-foreground">
                                            {formatHours(row.total_hours)} h
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="absolute top-full right-0 left-0 flex gap-0 px-1 pt-2">
                        {rows.map((row) => (
                            <div
                                key={row.label}
                                className="flex-1 text-center text-[11px] font-medium text-foreground"
                            >
                                {row.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <table className="table mt-5 [&_thead_th]:py-4">
                <thead>
                    <tr>
                        <th>Obdobie</th>
                        <th className="text-right">Hodiny</th>
                        <th className="text-right">Záznamy</th>
                        <th className="text-right">Priemer / záznam</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.label}>
                            <td className="font-medium">{row.label}</td>
                            <td className="mono text-right">
                                {formatHours(row.total_hours)} h
                            </td>
                            <td className="mono text-right text-muted-foreground">
                                {row.entries_count}
                            </td>
                            <td className="mono text-right text-muted-foreground">
                                {row.entries_count > 0
                                    ? `${formatHours(row.total_hours / row.entries_count)} h`
                                    : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            {message}
        </div>
    );
}
