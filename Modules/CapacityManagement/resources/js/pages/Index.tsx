import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, Download, MoreHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HistoryChart } from '../components/shared/history-chart';
import type {
    DashboardData,
    Person,
    ProjectPrediction,
    SimulationData,
} from '../types/capacity';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Kapacitné plánovanie', href: '/capacity-management' },
];

type CapacityManagementPageProps = {
    dashboard: DashboardData;
    can_manage: boolean;
};

type FilterKey = 'all' | 'overloaded' | 'risky' | 'free';
type SimulationPayload = {
    deadline_days_shift?: number;
    team_size?: number;
    remaining_hours?: number;
};

const SIMULATION_DEBOUNCE_MS = 300;

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

const csvValue = (value: string | number | boolean | null | undefined) => {
    const text = value === null || value === undefined ? '' : String(value);

    return `"${text.replace(/"/g, '""')}"`;
};

const downloadCsv = (
    filename: string,
    rows: Array<Array<string | number | boolean>>,
) => {
    const csv = rows
        .map((row) => row.map((value) => csvValue(value)).join(','))
        .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], {
        type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export default function Index({ dashboard }: CapacityManagementPageProps) {
    const [filter, setFilter] = useState<FilterKey>('all');
    const [search, setSearch] = useState('');
    const recommendationsRef = useRef<HTMLDivElement | null>(null);

    const overloadedPeople = useMemo(
        () =>
            dashboard.people
                .filter((person) => person.weekly_utilization > 100)
                .sort((a, b) => b.weekly_utilization - a.weekly_utilization),
        [dashboard.people],
    );

    const riskyPeople = dashboard.people.filter(
        (person) =>
            person.weekly_utilization >= 90 && person.weekly_utilization <= 100,
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
    const showRecommendations = () => {
        recommendationsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
        recommendationsRef.current?.focus({ preventScroll: true });
    };
    const exportDashboard = () => {
        const date = new Date().toISOString().slice(0, 10);

        downloadCsv(`kapacitne-planovanie-${date}.csv`, [
            ['Sekcia', 'Názov', 'Metrika', 'Hodnota', 'Doplnok'],
            [
                'Prehľad',
                'Týždeň',
                'Kapacita',
                dashboard.weekly_overview.capacity_hours,
                'h',
            ],
            [
                'Prehľad',
                'Týždeň',
                'Zaťaženie',
                dashboard.weekly_overview.load_hours,
                'h',
            ],
            [
                'Prehľad',
                'Týždeň',
                'Vyťaženie',
                dashboard.weekly_overview.utilization,
                '%',
            ],
            [
                'Prehľad',
                'Mesiac',
                'Kapacita',
                dashboard.monthly_overview.capacity_hours,
                'h',
            ],
            [
                'Prehľad',
                'Mesiac',
                'Zaťaženie',
                dashboard.monthly_overview.load_hours,
                'h',
            ],
            [
                'Prehľad',
                'Mesiac',
                'Vyťaženie',
                dashboard.monthly_overview.utilization,
                '%',
            ],
            ...filteredPeople.map((person) => [
                'Ľudia',
                person.name,
                'Týždeň',
                person.weekly_load_hours,
                `${person.weekly_utilization}% z ${person.weekly_capacity_hours}h`,
            ]),
            ...filteredPeople.map((person) => [
                'Ľudia',
                person.name,
                'Mesiac',
                person.monthly_load_hours,
                `${person.monthly_utilization}% z ${person.monthly_capacity_hours}h`,
            ]),
            ...dashboard.prediction.projects.map((project) => [
                'Projekty',
                project.name,
                'Predikcia',
                project.confidence,
                project.can_finish
                    ? `Stihne, ${project.days_remaining} dní`
                    : `Riziko, ${project.remaining_hours}h zostáva`,
            ]),
            ...dashboard.history.map((point) => [
                'História',
                point.week_label,
                'Vyťaženie',
                point.utilization,
                `${point.load_hours}h`,
            ]),
        ]);
    };

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
                            Prehľad ukazuje, kde tím nestíha, kto je preťažený a
                            kde je ešte priestor na zmenu. Aktuálny týždeň:{' '}
                            <strong className="font-semibold text-foreground">
                                28. apr - 4. máj 2026
                            </strong>
                        </p>
                    </div>
                    <div className="page-head__actions">
                        <button
                            type="button"
                            className="btn"
                            onClick={exportDashboard}
                            disabled={dashboard.people.length === 0}
                            title={
                                dashboard.people.length === 0
                                    ? 'Nie sú žiadne kapacitné dáta na export'
                                    : 'Exportovať kapacitný dashboard do CSV'
                            }
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>

                {overloadedPeople.length > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-text)]">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <div className="flex-1">
                            <strong>
                                {overloadedPeople.length} ľudí je preťažených
                            </strong>{' '}
                            tento týždeň. Najviac{' '}
                            <strong>{overloadedPeople[0].name}</strong> (
                            {overloadedPeople[0].weekly_utilization}%). Zvážte
                            prerozdelenie úloh alebo posun deadlineov.
                        </div>
                        <button
                            type="button"
                            className="btn btn--sm bg-card"
                            onClick={showRecommendations}
                        >
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
                            <sub>
                                / {dashboard.prediction.projects.length} stihne
                            </sub>
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
                        <div ref={recommendationsRef} tabIndex={-1}>
                            <RecommendationsCard
                                overloadedPeople={overloadedPeople}
                                riskyProjects={riskyProjects}
                            />
                        </div>

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
                                <HistoryChart
                                    data={dashboard.history}
                                    height={220}
                                />
                            </div>
                        </section>
                    </main>

                    <aside className="col gap-4">
                        <SimulatorCard project={simulationProject} />
                        <RiskProjectsCard
                            projects={dashboard.prediction.projects}
                        />
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
                            style={{
                                background: utilizationColor(row.utilization),
                            }}
                        />
                        <span className="avatar avatar--sm">
                            {initials(row.name)}
                        </span>
                        <div className="min-w-0 flex-1 text-sm">
                            <div className="font-medium text-foreground">
                                {row.name}{' '}
                                <span
                                    className="mono text-xs"
                                    style={{
                                        color: utilizationColor(
                                            row.utilization,
                                        ),
                                    }}
                                >
                                    {row.utilization}%
                                </span>
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                                {row.note}
                            </div>
                        </div>
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
                    <span className="avatar avatar--sm">
                        {initials(person.name)}
                    </span>
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
                        <ProgressLine
                            value={person.weekly_utilization}
                            tone={tone}
                        />
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
                    style={{
                        color: utilizationColor(person.weekly_utilization),
                    }}
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
    const [simulation, setSimulation] = useState<SimulationData | null>(null);
    const [deadlineDaysShift, setDeadlineDaysShift] = useState(0);
    const [teamSize, setTeamSize] = useState(0);
    const [remainingHours, setRemainingHours] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const runSimulation = useCallback(
        (payload: SimulationPayload, debounce = true) => {
            if (!project) return;

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            const request = () => {
                setLoading(true);
                setError(null);

                axios
                    .post<{ simulation: SimulationData }>(
                        `/capacity-management/simulation/project/${project.id}/run`,
                        payload,
                        {
                            headers: {
                                Accept: 'application/json',
                            },
                        },
                    )
                    .then(({ data }) => {
                        setSimulation(data.simulation);
                    })
                    .catch(() => {
                        setError('Simuláciu sa nepodarilo prepočítať.');
                    })
                    .finally(() => setLoading(false));
            };

            if (debounce) {
                timerRef.current = setTimeout(request, SIMULATION_DEBOUNCE_MS);
            } else {
                request();
            }
        },
        [project],
    );

    useEffect(() => {
        if (!project) {
            setSimulation(null);
            setDeadlineDaysShift(0);
            setTeamSize(0);
            setRemainingHours(0);
            return;
        }

        setDeadlineDaysShift(0);
        setTeamSize(0);
        setRemainingHours(project.remaining_hours);
        runSimulation({}, false);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [project, runSimulation]);

    useEffect(() => {
        if (!simulation) return;

        setTeamSize(simulation.simulated_team_size);
        setRemainingHours(simulation.simulated_remaining_hours);
    }, [simulation]);

    const baselineTeamSize = simulation?.baseline_team_size ?? 0;
    const baselineRemainingHours =
        simulation?.baseline_remaining_hours ?? project?.remaining_hours ?? 0;
    const canUseSliders = Boolean(project && simulation);
    const predictionWillMeet =
        simulation?.will_meet_deadline ?? project?.can_finish ?? false;
    const predictionConfidence = project?.confidence ?? 0;
    const teamMax = Math.max(baselineTeamSize * 3, 10);
    const remainingMax = Math.max(Math.round(baselineRemainingHours * 2), 100);

    const resetSimulation = () => {
        const nextTeamSize = simulation?.baseline_team_size ?? baselineTeamSize;
        const nextRemainingHours =
            simulation?.baseline_remaining_hours ?? baselineRemainingHours;

        setDeadlineDaysShift(0);
        setTeamSize(nextTeamSize);
        setRemainingHours(nextRemainingHours);
        runSimulation(
            {
                deadline_days_shift: 0,
                team_size: nextTeamSize,
                remaining_hours: nextRemainingHours,
            },
            false,
        );
    };

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
                    <select
                        className="select w-full"
                        value={project?.id ?? ''}
                        disabled
                    >
                        {project ? (
                            <option value={project.id}>{project.name}</option>
                        ) : (
                            <option>Žiadny projekt</option>
                        )}
                    </select>
                </LabeledValue>
                <SliderControl
                    label="Veľkosť tímu"
                    value={teamSize}
                    displayValue={`${teamSize} ľudí`}
                    min={0}
                    max={teamMax}
                    step={1}
                    disabled={!canUseSliders}
                    onChange={(value) => {
                        setTeamSize(value);
                        runSimulation({
                            deadline_days_shift: deadlineDaysShift,
                            team_size: value,
                            remaining_hours: remainingHours,
                        });
                    }}
                />
                <SliderControl
                    label="Posun deadline-u"
                    value={deadlineDaysShift}
                    displayValue={
                        deadlineDaysShift > 0
                            ? `+${deadlineDaysShift} dní`
                            : `${deadlineDaysShift} dní`
                    }
                    min={-30}
                    max={90}
                    step={1}
                    disabled={!canUseSliders}
                    onChange={(value) => {
                        setDeadlineDaysShift(value);
                        runSimulation({
                            deadline_days_shift: value,
                            team_size: teamSize,
                            remaining_hours: remainingHours,
                        });
                    }}
                />
                <SliderControl
                    label="Zostávajúce hodiny"
                    value={Math.round(remainingHours)}
                    displayValue={`${Math.round(remainingHours)}h`}
                    min={0}
                    max={remainingMax}
                    step={5}
                    disabled={!canUseSliders}
                    onChange={(value) => {
                        setRemainingHours(value);
                        runSimulation({
                            deadline_days_shift: deadlineDaysShift,
                            team_size: teamSize,
                            remaining_hours: value,
                        });
                    }}
                />
                <div className="rounded-md border border-[var(--warning-border)] bg-[var(--warning-soft)] p-3">
                    <div className="mb-1 text-[11px] font-semibold tracking-widest text-[var(--warning-text)] uppercase">
                        Predikcia
                    </div>
                    <div className="text-sm text-foreground">
                        Projekt{' '}
                        <strong>
                            {predictionWillMeet
                                ? 'stihne deadline'
                                : 'nestihne deadline'}
                        </strong>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        {simulation?.forecast_finish_date
                            ? `Odhad dokončenia ${new Date(simulation.forecast_finish_date).toLocaleDateString('sk-SK')}`
                            : `Istota výpočtu ${predictionConfidence}%`}
                    </div>
                </div>
                {(loading || error) && (
                    <div
                        className={`text-xs ${error ? 'text-[var(--danger-text)]' : 'text-muted-foreground'}`}
                    >
                        {error ?? 'Prepočítavam simuláciu...'}
                    </div>
                )}
                {simulation &&
                    (deadlineDaysShift !== 0 ||
                        teamSize !== simulation.baseline_team_size ||
                        remainingHours !==
                            simulation.baseline_remaining_hours) && (
                        <button
                            type="button"
                            className="btn btn--ghost btn--sm w-full"
                            onClick={resetSimulation}
                            disabled={loading}
                        >
                            Resetovať simuláciu
                        </button>
                    )}
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

function SliderControl({
    label,
    value,
    displayValue,
    min,
    max,
    step,
    disabled,
    onChange,
}: {
    label: string;
    value: number;
    displayValue: string;
    min: number;
    max: number;
    step: number;
    disabled: boolean;
    onChange: (value: number) => void;
}) {
    return (
        <LabeledValue label={label} value={displayValue}>
            <input
                type="range"
                className="w-full accent-[var(--accent-blue)] disabled:opacity-50"
                min={min}
                max={max}
                step={step}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(Number(event.target.value))}
            />
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
            <div className="mb-1.5 flex justify-between text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
                <span>{label}</span>
                {value && (
                    <span className="mono tracking-normal normal-case">
                        {value}
                    </span>
                )}
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
                            <ProgressLine
                                value={project.confidence}
                                tone={tone}
                            />
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
