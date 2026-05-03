import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, Download, MoreHorizontal, RefreshCw, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { HistoryChart } from '../components/shared/history-chart';
import type { DashboardData, Person, ProjectPrediction } from '../types/capacity';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Kapacitné plánovanie', href: '/capacity-management' },
];

type CapacityManagementPageProps = {
    dashboard: DashboardData;
    can_manage: boolean;
};

type FilterKey = 'all' | 'overloaded' | 'risky' | 'free';

const initials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const utilizationTone = (utilization: number) => {
    if (utilization > 100) return 'danger';
    if (utilization >= 90) return 'warning';
    if (utilization < 60) return 'success';
    return 'accent';
};

const utilizationColor = (utilization: number) => {
    if (utilization > 100) return 'var(--danger-text)';
    if (utilization >= 90) return 'var(--warning-text)';
    return 'var(--success-text)';
};

export default function Index({
    dashboard,
}: CapacityManagementPageProps) {
    const [filter, setFilter] = useState<FilterKey>('all');
    const [search, setSearch] = useState('');

    const overloadedPeople = useMemo(
        () =>
            dashboard.people
                .filter((person) => person.weekly_utilization > 100)
                .sort((a, b) => b.weekly_utilization - a.weekly_utilization),
        [dashboard.people],
    );

    const riskyPeople = dashboard.people.filter(
        (person) =>
            person.weekly_utilization >= 90 &&
            person.weekly_utilization <= 100,
    );
    const freePeople = dashboard.people.filter(
        (person) => person.weekly_utilization < 60,
    );

    const riskyProjects = dashboard.prediction.projects
        .filter((project) => !project.can_finish || project.confidence < 90)
        .sort((a, b) => a.confidence - b.confidence);

    const filteredPeople = dashboard.people.filter((person) => {
        if (
            search &&
            !person.name.toLowerCase().includes(search.toLowerCase())
        ) {
            return false;
        }
        if (filter === 'overloaded') return person.weekly_utilization > 100;
        if (filter === 'risky') {
            return (
                person.weekly_utilization >= 90 &&
                person.weekly_utilization <= 100
            );
        }
        if (filter === 'free') return person.weekly_utilization < 60;
        return true;
    });

    const simulationProject = dashboard.prediction.projects[0];
    const finishableProjects = dashboard.prediction.projects.filter(
        (project) => project.can_finish,
    ).length;
    const weeklyFreeCapacity =
        dashboard.weekly_overview.capacity_hours -
        dashboard.weekly_overview.load_hours;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kapacitné plánovanie" />

            <div className="page page-enter">
                <div className="page-head">
                    <div>
                        <h1 className="page-head__title">
                            Kapacitné plánovanie
                        </h1>
                        <p className="page-head__subtitle">
                            Prehľad ukazuje, kde tím nestíha, kto je preťažený
                            a kde je ešte priestor na zmenu. Aktuálny týždeň:{' '}
                            <strong className="font-semibold text-foreground">
                                28. apr - 4. máj 2026
                            </strong>
                        </p>
                    </div>
                    <div className="page-head__actions">
                        <button type="button" className="btn">
                            <RefreshCw className="h-4 w-4" />
                            Sync s projektmi
                        </button>
                        <button type="button" className="btn">
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                        {simulationProject ? (
                            <Link
                                href={`/capacity-management/simulation/project/${simulationProject.id}`}
                                className="btn btn--primary"
                            >
                                <Zap className="h-4 w-4" />
                                Spustiť simuláciu
                            </Link>
                        ) : (
                            <button type="button" className="btn btn--primary" disabled>
                                <Zap className="h-4 w-4" />
                                Spustiť simuláciu
                            </button>
                        )}
                    </div>
                </div>

                {overloadedPeople.length > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-text)]">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <div className="flex-1">
                            <strong>{overloadedPeople.length} ľudí je preťažených</strong>{' '}
                            tento týždeň. Najviac{' '}
                            <strong>{overloadedPeople[0].name}</strong> (
                            {overloadedPeople[0].weekly_utilization}%).
                            Zvážte prerozdelenie úloh alebo posun deadlineov.
                        </div>
                        <button type="button" className="btn btn--sm bg-card">
                            Pozrieť odporúčania
                        </button>
                    </div>
                )}

                <div className="kpi-grid">
                    <div className="kpi">
                        <span className="kpi__label">Vyťaženie tímu</span>
                        <span
                            className="kpi__value"
                            style={{
                                color: utilizationColor(
                                    dashboard.weekly_overview.utilization,
                                ),
                            }}
                        >
                            {dashboard.weekly_overview.utilization}
                            <sub>%</sub>
                        </span>
                        <ProgressLine
                            value={dashboard.weekly_overview.utilization}
                            tone={utilizationTone(
                                dashboard.weekly_overview.utilization,
                            )}
                        />
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Preťažení</span>
                        <span
                            className="kpi__value"
                            style={{ color: 'var(--danger-text)' }}
                        >
                            {overloadedPeople.length}
                        </span>
                        <span className="kpi__delta kpi__delta--down">
                            1 oproti minulému týždňu
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Voľná kapacita</span>
                        <span className="kpi__value">
                            {Math.round(weeklyFreeCapacity)}
                            <sub>h / týždeň</sub>
                        </span>
                        <span className="kpi__delta">
                            {freePeople.length} ľudí má rezervu
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Predikcia projektov</span>
                        <span className="kpi__value">
                            {finishableProjects}
                            <sub>/ {dashboard.prediction.projects.length} stihne</sub>
                        </span>
                        <span
                            className="kpi__delta"
                            style={{ color: 'var(--warning-text)' }}
                        >
                            {riskyProjects.length} projekt ohrozený
                        </span>
                    </div>
                </div>

                <div className="grid-main-side">
                    <main className="col gap-5">
                        <RecommendationsCard
                            overloadedPeople={overloadedPeople}
                            riskyProjects={riskyProjects}
                        />

                        <section className="card">
                            <div className="card__head">
                                <div>
                                    <h3 className="card__title">
                                        Ľudia a ich vyťaženie
                                    </h3>
                                    <div className="card__sub">
                                        {filteredPeople.length} z{' '}
                                        {dashboard.people.length} členov tímu
                                    </div>
                                </div>
                                <div className="command-bar__filters">
                                    <FilterButton
                                        label="Všetci"
                                        count={dashboard.people.length}
                                        active={filter === 'all'}
                                        onClick={() => setFilter('all')}
                                    />
                                    <FilterButton
                                        label="Preťažení"
                                        count={overloadedPeople.length}
                                        active={filter === 'overloaded'}
                                        onClick={() => setFilter('overloaded')}
                                    />
                                    <FilterButton
                                        label="Na hranici"
                                        count={riskyPeople.length}
                                        active={filter === 'risky'}
                                        onClick={() => setFilter('risky')}
                                    />
                                    <FilterButton
                                        label="Voľní"
                                        count={freePeople.length}
                                        active={filter === 'free'}
                                        onClick={() => setFilter('free')}
                                    />
                                </div>
                            </div>
                            <div className="card__head border-t-0 py-3">
                                <div className="field-wrap max-w-xs flex-1">
                                    <input
                                        className="input w-full"
                                        placeholder="Hľadať osobu..."
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Osoba</th>
                                            <th>Týždeň</th>
                                            <th>Vyťaženie</th>
                                            <th>Voľné</th>
                                            <th>12-týždenný trend</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPeople.map((person) => (
                                            <PersonRow
                                                key={person.id}
                                                person={person}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="card">
                            <div className="card__head">
                                <h3 className="card__title">
                                    História vyťaženia tímu (12 týždňov)
                                </h3>
                                <select className="select text-xs">
                                    <option>Posledných 12 týždňov</option>
                                </select>
                            </div>
                            <div className="card__body">
                                <HistoryChart data={dashboard.history} height={220} />
                            </div>
                        </section>
                    </main>

                    <aside className="col gap-4">
                        <SimulatorCard project={simulationProject} />
                        <RiskProjectsCard projects={dashboard.prediction.projects} />
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}

function ProgressLine({
    value,
    tone = 'accent',
}: {
    value: number;
    tone?: 'accent' | 'success' | 'warning' | 'danger';
}) {
    const toneClass =
        tone === 'success'
            ? 'progress__fill--success'
            : tone === 'warning'
              ? 'progress__fill--warning'
              : tone === 'danger'
                ? 'progress__fill--danger'
                : '';

    return (
        <div className="progress mt-3">
            <div
                className={`progress__fill ${toneClass}`}
                style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
            />
        </div>
    );
}

function FilterButton({
    label,
    count,
    active,
    onClick,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className={`btn btn--sm ${active ? 'btn--primary' : ''}`}
            onClick={onClick}
        >
            {label}
            <span className="opacity-60">{count}</span>
        </button>
    );
}

function RecommendationsCard({
    overloadedPeople,
    riskyProjects,
}: {
    overloadedPeople: Person[];
    riskyProjects: ProjectPrediction[];
}) {
    const rows = [
        ...overloadedPeople.slice(0, 2).map((person) => ({
            id: `person-${person.id}`,
            name: person.name,
            utilization: person.weekly_utilization,
            note: `Návrh: presunúť ${Math.max(1, Math.round(person.weekly_load_hours - person.weekly_capacity_hours))}h týždenne`,
        })),
        ...riskyProjects.slice(0, 1).map((project) => ({
            id: `project-${project.id}`,
            name: project.name,
            utilization: project.confidence,
            note: `Návrh: overiť deadline, ${project.days_remaining} dní do termínu`,
        })),
    ];

    return (
        <section className="card">
            <div className="card__head">
                <div>
                    <h3 className="card__title">Odporúčania</h3>
                    <div className="card__sub">
                        Akcie, ktoré dnes pomôžu uvoľniť tlak
                    </div>
                </div>
            </div>
            <div className="card__body space-y-2.5">
                {rows.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Aktuálne nie sú odporúčané zásahy.
                    </p>
                )}
                {rows.map((row) => (
                    <div
                        key={row.id}
                        className="flex items-center gap-3 rounded-md border border-border px-3.5 py-3"
                    >
                        <span
                            className="dot"
                            style={{ background: utilizationColor(row.utilization) }}
                        />
                        <span className="avatar avatar--sm">{initials(row.name)}</span>
                        <div className="min-w-0 flex-1 text-sm">
                            <div className="font-medium text-foreground">
                                {row.name}{' '}
                                <span
                                    className="mono text-xs"
                                    style={{
                                        color: utilizationColor(row.utilization),
                                    }}
                                >
                                    {row.utilization}%
                                </span>
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                                {row.note}
                            </div>
                        </div>
                        <button type="button" className="btn btn--sm">
                            Aplikovať
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}

function PersonRow({ person }: { person: Person }) {
    const tone = utilizationTone(person.weekly_utilization);

    return (
        <tr>
            <td>
                <div className="flex items-center gap-3">
                    <span className="avatar avatar--sm">{initials(person.name)}</span>
                    <div>
                        <div className="font-medium text-foreground">
                            {person.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {person.email}
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <div className="flex items-center gap-3">
                    <div className="min-w-32 flex-1">
                        <ProgressLine value={person.weekly_utilization} tone={tone} />
                    </div>
                    <span className="mono min-w-16 text-right text-xs">
                        {person.weekly_load_hours}h /{' '}
                        {person.weekly_capacity_hours}h
                    </span>
                </div>
            </td>
            <td>
                <span
                    className="mono font-semibold"
                    style={{ color: utilizationColor(person.weekly_utilization) }}
                >
                    {person.weekly_utilization}%
                </span>
            </td>
            <td>
                <span
                    className="mono text-xs"
                    style={{
                        color:
                            person.free_capacity_hours < 0
                                ? 'var(--danger-text)'
                                : 'var(--text-secondary)',
                    }}
                >
                    {person.free_capacity_hours > 0 ? '+' : ''}
                    {person.free_capacity_hours}h
                </span>
            </td>
            <td>
                <div className="flex h-8 items-end gap-1">
                    {person.history.slice(-12).map((point) => (
                        <span
                            key={point.week_label}
                            className="w-1.5 rounded-sm"
                            style={{
                                height: `${Math.max(6, Math.min(point.utilization, 120) / 4)}px`,
                                background:
                                    point.utilization > 100
                                        ? 'var(--danger)'
                                        : point.utilization >= 90
                                          ? 'var(--warning)'
                                          : 'var(--accent-blue)',
                            }}
                            title={`${point.week_label}: ${point.utilization}%`}
                        />
                    ))}
                </div>
            </td>
            <td>
                <button type="button" className="icon-btn">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </td>
        </tr>
    );
}

function SimulatorCard({ project }: { project?: ProjectPrediction }) {
    return (
        <section className="card">
            <div className="card__head">
                <div>
                    <h3 className="card__title">Simulátor projektu</h3>
                    <div className="card__sub">
                        Pozri dopad zmeny tímu / deadline-u
                    </div>
                </div>
            </div>
            <div className="card__body space-y-4">
                <LabeledValue label="Projekt">
                    <select className="select w-full" value={project?.id ?? ''} disabled>
                        {project ? (
                            <option value={project.id}>{project.name}</option>
                        ) : (
                            <option>Žiadny projekt</option>
                        )}
                    </select>
                </LabeledValue>
                <SliderPreview label="Veľkosť tímu" value="8 ľudí" />
                <SliderPreview label="Posun deadline-u" value="+0 dní" />
                <SliderPreview
                    label="Zostávajúce hodiny"
                    value={`${project?.remaining_hours ?? 0}h`}
                />
                <div className="rounded-md border border-[var(--warning-border)] bg-[var(--warning-soft)] p-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--warning-text)]">
                        Predikcia
                    </div>
                    <div className="text-sm text-foreground">
                        Projekt{' '}
                        <strong>
                            {project?.can_finish ? 'stihne deadline' : 'nestihne deadline'}
                        </strong>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        Istota výpočtu {project?.confidence ?? 0}%
                    </div>
                </div>
                {project && (
                    <Link
                        href={`/capacity-management/simulation/project/${project.id}`}
                        className="btn btn--primary w-full"
                    >
                        Otvoriť detailnú simuláciu
                    </Link>
                )}
            </div>
        </section>
    );
}

function SliderPreview({ label, value }: { label: string; value: string }) {
    return (
        <LabeledValue label={label} value={value}>
            <input type="range" className="w-full accent-[var(--accent-blue)]" disabled />
        </LabeledValue>
    );
}

function LabeledValue({
    label,
    value,
    children,
}: {
    label: string;
    value?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <div className="mb-1.5 flex justify-between text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                <span>{label}</span>
                {value && <span className="mono normal-case tracking-normal">{value}</span>}
            </div>
            {children}
        </div>
    );
}

function RiskProjectsCard({ projects }: { projects: ProjectPrediction[] }) {
    return (
        <section className="card">
            <div className="card__head">
                <h3 className="card__title">Projekty v ohrození</h3>
            </div>
            <div className="card__body space-y-3">
                {projects.slice(0, 3).map((project) => {
                    const tone =
                        project.confidence < 50
                            ? 'danger'
                            : project.confidence < 75
                              ? 'warning'
                              : 'success';
                    return (
                        <div key={project.id}>
                            <div className="mb-1 flex items-baseline justify-between gap-2">
                                <span className="truncate text-sm font-medium">
                                    {project.name}
                                </span>
                                <span
                                    className="mono text-xs"
                                    style={{
                                        color:
                                            tone === 'danger'
                                                ? 'var(--danger-text)'
                                                : tone === 'warning'
                                                  ? 'var(--warning-text)'
                                                  : 'var(--success-text)',
                                    }}
                                >
                                    {project.confidence}% istota
                                </span>
                            </div>
                            <ProgressLine value={project.confidence} tone={tone} />
                            <div className="mt-1 text-xs text-muted-foreground">
                                {project.days_remaining} dní do deadline-u
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
