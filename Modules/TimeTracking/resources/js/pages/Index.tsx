import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Check, Pause, Play, Plus } from 'lucide-react';
import { Project } from 'Modules/Project/resources/js/types/types';
import { useMemo, useState } from 'react';
import { EntryRowActions } from '../components/index/entry-row-actions';
import { ManualEntryDialog } from '../components/index/manual-entry-dialog';
import { QuickAddCard } from '../components/index/quick-add-card';
import { StopTimerDialog } from '../components/time-entry-table/dialogs/stop-timer';
import { useTimer } from '../context/timer-context';
import { TimeEntry } from '../types/types';

interface WeekDay {
    date: string;
    label: string;
    short_date: string;
    hours: number;
}

interface TimeTrackingSummary {
    scope: 'all' | 'mine';
    week_start: string;
    week_end: string;
    week_range_label: string;
    week_total: number;
    prev_week_total: number;
    month_total: number;
    week_target: number;
    month_target: number;
    week_daily_hours: WeekDay[];
    week_project_hours: Record<number, number>;
}

interface IndexProps {
    projects: Project[];
    entries: TimeEntry[];
    summary: TimeTrackingSummary;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Evidencia času', href: '/time-tracking' },
];

const projectColors = ['#6366f1', '#0ea5e9', '#10b981', '#94a3b8', '#d97706'];

const formatHours = (hours: number) =>
    Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;

const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const dateKey = (value: string) => value.substring(0, 10);

const statusBadge = (status: TimeEntry['status']) => {
    if (status === 'pending') {
        return { className: 'badge badge--warning', label: 'Pending' };
    }

    if (status === 'rejected') {
        return { className: 'badge badge--danger', label: 'Rejected' };
    }

    return { className: 'badge badge--success', label: 'Schválené' };
};

export default function Index({ projects, entries, summary }: IndexProps) {
    const { props } = usePage<SharedData>();
    const currentUserId = props.auth.user.id;
    const [view, setView] = useState<'week' | 'month'>('week');
    const { timer, startTimer } = useTimer();
    const running = timer.isRunning;
    const elapsed = timer.elapsed;

    const [selectedProjectId, setSelectedProjectId] = useState<number | ''>(
        projects[0]?.id ?? '',
    );
    const [selectedTaskId, setSelectedTaskId] = useState<number | ''>('');
    const [timerNote, setTimerNote] = useState('');
    const [entryProjectFilter, setEntryProjectFilter] = useState<
        number | 'all'
    >('all');
    const [stopOpen, setStopOpen] = useState(false);
    const [manualOpen, setManualOpen] = useState(false);

    const projectById = useMemo(
        () =>
            new Map(
                projects.map((project, index) => [
                    project.id,
                    {
                        project,
                        color: projectColors[index % projectColors.length],
                    },
                ]),
            ),
        [projects],
    );

    const weekTotal = Number(summary.week_total);
    const monthTotal = Number(summary.month_total);
    const prevWeekTotal = Number(summary.prev_week_total);
    const weekDelta = weekTotal - prevWeekTotal;
    const weekTarget = Number(summary.week_target) || 40;
    const monthTarget = Number(summary.month_target) || 160;
    const isTeamScope = summary.scope === 'all';

    const filteredEntries =
        entryProjectFilter === 'all'
            ? entries
            : entries.filter(
                  (entry) => entry.project_id === entryProjectFilter,
              );

    const totalEntriesHours = filteredEntries.reduce(
        (sum, entry) => sum + Number(entry.hours),
        0,
    );

    const entriesByDate = filteredEntries.reduce<Record<string, TimeEntry[]>>(
        (groups, entry) => {
            const key = dateKey(entry.entry_date);
            groups[key] = groups[key] ?? [];
            groups[key].push(entry);
            return groups;
        },
        {},
    );

    const sortedDates = Object.keys(entriesByDate).sort((a, b) =>
        b.localeCompare(a),
    );

    const weekDays = summary.week_daily_hours;
    const maxDayHours = Math.max(10, ...weekDays.map((day) => day.hours));
    const daysWithHours = weekDays.filter((day) => day.hours > 0).length;
    const dailyAverage = daysWithHours ? weekTotal / daysWithHours : 0;

    const breakdown = projects
        .map((project, index) => ({
            project,
            hours: Number(summary.week_project_hours[project.id] ?? 0),
            color: projectColors[index % projectColors.length],
        }))
        .filter((item) => item.hours > 0);

    const selectedProject =
        selectedProjectId === ''
            ? projects[0]
            : projects.find((project) => project.id === selectedProjectId);

    const taskOptions = (selectedProject?.tasks ?? []).filter((task) =>
        task.assigned_users?.some((user) => user.id === currentUserId),
    );
    const effectiveTaskId: number | null =
        selectedTaskId !== '' &&
        taskOptions.some((t) => t.id === selectedTaskId)
            ? (selectedTaskId as number)
            : (taskOptions[0]?.id ?? null);

    const handleTimerToggle = () => {
        if (running) {
            setStopOpen(true);
            return;
        }

        if (!selectedProject || effectiveTaskId === null) return;
        const task = taskOptions.find((t) => t.id === effectiveTaskId);
        if (!task) return;

        startTimer(
            { id: selectedProject.id, name: selectedProject.name },
            { id: task.id, title: task.title },
        );
    };

    const canStartTimer = !!selectedProject && effectiveTaskId !== null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Evidencia času" />

            <div className="page page-enter">
                <div className="page-head">
                    <div>
                        <h1 className="page-head__title">Evidencia času</h1>
                        <p className="page-head__subtitle">
                            {isTeamScope
                                ? 'Prehľad odpracovaných hodín celého tímu. '
                                : 'Sleduj hodiny strávené na projektoch. '}
                            Týždeň{' '}
                            <strong className="font-semibold text-foreground">
                                {summary.week_range_label}
                            </strong>
                        </p>
                    </div>
                </div>

                <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                    <div
                        className="flex items-center gap-4 p-4"
                        style={{
                            borderLeft: `4px solid ${running ? 'var(--success)' : 'var(--border)'}`,
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleTimerToggle}
                            disabled={!running && !canStartTimer}
                            className="inline-flex size-12 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            style={{
                                background: running
                                    ? 'var(--danger)'
                                    : 'var(--accent-blue)',
                                boxShadow: running
                                    ? '0 0 0 4px var(--danger-soft)'
                                    : '0 0 0 4px var(--accent-blue-soft)',
                            }}
                            title={
                                running
                                    ? 'Zastaviť časovač'
                                    : canStartTimer
                                      ? 'Spustiť časovač'
                                      : 'Vyber projekt a úlohu'
                            }
                        >
                            {running ? (
                                <Pause className="h-5 w-5" />
                            ) : (
                                <Play className="h-5 w-5 fill-current" />
                            )}
                        </button>

                        <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(180px,1.2fr)_minmax(180px,1.2fr)_minmax(180px,1.8fr)]">
                            <select
                                className="select w-full"
                                value={
                                    running && timer.projectId
                                        ? timer.projectId
                                        : selectedProjectId
                                }
                                disabled={running}
                                onChange={(event) => {
                                    setSelectedProjectId(
                                        event.target.value
                                            ? Number(event.target.value)
                                            : '',
                                    );
                                    setSelectedTaskId('');
                                }}
                            >
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="select w-full"
                                value={
                                    running && timer.taskId
                                        ? timer.taskId
                                        : (effectiveTaskId ?? '')
                                }
                                disabled={running || !taskOptions.length}
                                onChange={(event) =>
                                    setSelectedTaskId(
                                        event.target.value
                                            ? Number(event.target.value)
                                            : '',
                                    )
                                }
                            >
                                {taskOptions.length ? (
                                    taskOptions.map((task) => (
                                        <option key={task.id} value={task.id}>
                                            {task.title}
                                        </option>
                                    ))
                                ) : (
                                    <option value="">Bez úlohy</option>
                                )}
                            </select>
                            <input
                                className="input w-full"
                                placeholder="Krátka poznámka (voliteľné)..."
                                value={timerNote}
                                onChange={(event) =>
                                    setTimerNote(event.target.value)
                                }
                                disabled={running}
                            />
                        </div>

                        <div className="min-w-28 text-right">
                            <div className="mono text-2xl font-semibold text-muted-foreground">
                                {formatTimer(elapsed)}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                {running ? (
                                    <span className="text-[var(--success-text)]">
                                        Beží
                                    </span>
                                ) : (
                                    'Pozastavené'
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <StopTimerDialog open={stopOpen} onOpenChange={setStopOpen} />
                <ManualEntryDialog
                    open={manualOpen}
                    onOpenChange={setManualOpen}
                    projects={projects}
                    initialProjectId={
                        selectedProjectId === '' ? null : selectedProjectId
                    }
                />

                <div className="kpi-grid">
                    <KpiProgress
                        label="Tento týždeň"
                        value={formatHours(weekTotal)}
                        suffix={`/ ${weekTarget}h`}
                        progress={(weekTotal / weekTarget) * 100}
                    />
                    <div className="kpi">
                        <span className="kpi__label">Minulý týždeň</span>
                        <span className="kpi__value">
                            {formatHours(prevWeekTotal).replace('h', '')}
                            <sub>h</sub>
                        </span>
                        <span
                            className={`kpi__delta ${weekDelta > 0 ? 'kpi__delta--up' : weekDelta < 0 ? 'kpi__delta--down' : ''}`}
                        >
                            {weekDelta > 0 ? '+' : ''}
                            {formatHours(weekDelta)} vs minulý týždeň
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Priemer / deň</span>
                        <span className="kpi__value">
                            {dailyAverage.toFixed(1)}
                            <sub>h</sub>
                        </span>
                        <span className="kpi__delta">Cieľ: 8h / deň</span>
                    </div>
                    <KpiProgress
                        label="Tento mesiac"
                        value={formatHours(monthTotal)}
                        suffix={`/ ${monthTarget}h`}
                        progress={(monthTotal / monthTarget) * 100}
                    />
                </div>

                <div className="grid-main-side">
                    <main className="col gap-5">
                        <section className="card">
                            <div className="card__head">
                                <div>
                                    <h3 className="card__title">
                                        Prehľad týždňa
                                    </h3>
                                    <div className="card__sub">
                                        Hodiny po dňoch a projektoch
                                    </div>
                                </div>
                                <div className="seg">
                                    <button
                                        type="button"
                                        className={`seg__btn ${view === 'week' ? 'is-active' : ''}`}
                                        onClick={() => setView('week')}
                                    >
                                        Týždeň
                                    </button>
                                    <button
                                        type="button"
                                        className={`seg__btn ${view === 'month' ? 'is-active' : ''}`}
                                        onClick={() => setView('month')}
                                    >
                                        Mesiac
                                    </button>
                                </div>
                            </div>
                            <div className="card__body">
                                <div className="flex h-52 items-end gap-4 px-1">
                                    {weekDays.map((day) => {
                                        const height =
                                            (day.hours / maxDayHours) * 100;
                                        return (
                                            <div
                                                key={day.date}
                                                className="flex h-full flex-1 flex-col items-center gap-2"
                                            >
                                                <div className="flex w-full flex-1 flex-col items-center justify-end">
                                                    <span className="mono mb-1 text-xs text-muted-foreground">
                                                        {day.hours
                                                            ? formatHours(
                                                                  day.hours,
                                                              )
                                                            : '-'}
                                                    </span>
                                                    <div
                                                        className="w-full max-w-14 rounded-t bg-[var(--accent-blue)]"
                                                        style={{
                                                            height: day.hours
                                                                ? `${height}%`
                                                                : 2,
                                                            opacity:
                                                                day.hours >= 8
                                                                    ? 1
                                                                    : 0.18,
                                                        }}
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs font-medium">
                                                        {day.label}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {day.short_date}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        <section className="card">
                            <div className="card__head">
                                <div>
                                    <h3 className="card__title">Záznamy</h3>
                                    <div className="card__sub">
                                        {filteredEntries.length} záznamov,
                                        celkom {formatHours(totalEntriesHours)}
                                    </div>
                                </div>
                                <div className="command-bar__filters">
                                    <select
                                        className="select text-xs"
                                        value={entryProjectFilter}
                                        onChange={(event) =>
                                            setEntryProjectFilter(
                                                event.target.value === 'all'
                                                    ? 'all'
                                                    : Number(
                                                          event.target.value,
                                                      ),
                                            )
                                        }
                                    >
                                        <option value="all">
                                            Všetky projekty
                                        </option>
                                        {projects.map((project) => (
                                            <option
                                                key={project.id}
                                                value={project.id}
                                            >
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="btn btn--primary btn--sm"
                                        onClick={() => setManualOpen(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Manuálny záznam
                                    </button>
                                </div>
                            </div>
                            <div className="card__body card__body--flush">
                                {sortedDates.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-muted-foreground">
                                        Žiadne záznamy času.
                                    </div>
                                ) : (
                                    sortedDates.map((date) => (
                                        <DayGroup
                                            key={date}
                                            date={date}
                                            entries={entriesByDate[date]}
                                            projectById={projectById}
                                            showUser={isTeamScope}
                                        />
                                    ))
                                )}
                            </div>
                        </section>
                    </main>

                    <aside className="col gap-4">
                        <QuickAddCard projects={projects} />
                        <ProjectBreakdownCard
                            breakdown={breakdown}
                            totalHours={weekTotal}
                        />
                        <RecentCard
                            entries={entries.slice(0, 3)}
                            projectById={projectById}
                        />
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}

function KpiProgress({
    label,
    value,
    suffix,
    progress,
}: {
    label: string;
    value: string;
    suffix: string;
    progress: number;
}) {
    return (
        <div className="kpi">
            <span className="kpi__label">{label}</span>
            <span className="kpi__value">
                {value.replace('h', '')}
                <sub>h {suffix}</sub>
            </span>
            <div className="progress mt-3">
                <div
                    className="progress__fill"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </div>
        </div>
    );
}

function DayGroup({
    date,
    entries,
    projectById,
    showUser = false,
}: {
    date: string;
    entries: TimeEntry[];
    projectById: Map<number, { project: Project; color: string }>;
    showUser?: boolean;
}) {
    const total = entries.reduce((sum, entry) => sum + Number(entry.hours), 0);
    const dateObject = new Date(date);
    const dayLabel = ['Ne', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So'][
        dateObject.getDay()
    ];

    return (
        <div>
            <div className="flex items-baseline justify-between border-y border-border bg-muted/60 px-5 py-3">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">
                        {dayLabel}, {dateObject.toLocaleDateString('sk-SK')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {entries.length} záznam(y)
                    </span>
                </div>
                <span className="mono text-sm font-semibold">
                    {formatHours(total)}
                </span>
            </div>
            {entries.map((entry) => {
                const projectMeta = projectById.get(entry.project_id);
                return (
                    <div
                        key={entry.id}
                        className="grid grid-cols-[4px_minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-border px-5 py-3"
                    >
                        <span
                            className="h-8 rounded-sm"
                            style={{
                                background:
                                    projectMeta?.color ?? 'var(--accent-blue)',
                            }}
                        />
                        <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground">
                                {entry.task?.title ?? 'Bez úlohy'}
                                {showUser && entry.user?.name ? (
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                        · {entry.user.name}
                                    </span>
                                ) : null}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                                {projectMeta?.project.name ?? 'Projekt'}{' '}
                                {entry.description
                                    ? `· ${entry.description}`
                                    : ''}
                            </div>
                        </div>
                        <span className={statusBadge(entry.status).className}>
                            <Check className="h-3 w-3" />
                            {statusBadge(entry.status).label}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="mono text-sm font-semibold">
                                {formatHours(Number(entry.hours))}
                            </span>
                            {projectMeta?.project.current_user_permissions?.includes(
                                'manage_time_entries',
                            ) ? (
                                <EntryRowActions
                                    entry={entry}
                                    project={projectMeta?.project}
                                />
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ProjectBreakdownCard({
    breakdown,
    totalHours,
}: {
    breakdown: { project: Project; hours: number; color: string }[];
    totalHours: number;
}) {
    return (
        <section className="card">
            <div className="card__head">
                <h3 className="card__title">Rozloženie podľa projektov</h3>
                <span className="text-xs text-muted-foreground">
                    Tento týždeň
                </span>
            </div>
            <div className="card__body">
                <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-muted">
                    {breakdown.map((item) => (
                        <div
                            key={item.project.id}
                            style={{
                                flex: item.hours,
                                background: item.color,
                            }}
                        />
                    ))}
                </div>
                <div className="space-y-2.5">
                    {breakdown.map((item) => {
                        const percent = totalHours
                            ? Math.round((item.hours / totalHours) * 100)
                            : 0;
                        return (
                            <div
                                key={item.project.id}
                                className="flex items-center gap-2 text-sm"
                            >
                                <span
                                    className="size-2 rounded-sm"
                                    style={{ background: item.color }}
                                />
                                <span className="min-w-0 flex-1 truncate">
                                    {item.project.name}
                                </span>
                                <span className="mono text-xs text-muted-foreground">
                                    {percent}%
                                </span>
                                <span className="mono min-w-9 text-right font-medium">
                                    {formatHours(item.hours)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function RecentCard({
    entries,
    projectById,
}: {
    entries: TimeEntry[];
    projectById: Map<number, { project: Project; color: string }>;
}) {
    const { startTimer } = useTimer();

    return (
        <section className="card">
            <div className="card__head">
                <h3 className="card__title">Naposledy použité</h3>
            </div>
            <div className="card__body space-y-1.5">
                {entries.map((entry) => {
                    const meta = projectById.get(entry.project_id);
                    const taskTitle = entry.task?.title ?? 'Bez úlohy';
                    const canStart = !!meta && !!entry.task;

                    return (
                        <button
                            key={entry.id}
                            type="button"
                            className="btn btn--ghost w-full justify-between px-2"
                            disabled={!canStart}
                            onClick={() => {
                                if (!meta || !entry.task) return;
                                startTimer(
                                    {
                                        id: meta.project.id,
                                        name: meta.project.name,
                                    },
                                    {
                                        id: entry.task.id,
                                        title: entry.task.title,
                                    },
                                );
                            }}
                            title={
                                canStart
                                    ? `Spustiť časovač pre: ${taskTitle}`
                                    : undefined
                            }
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <span
                                    className="size-1.5 rounded-sm"
                                    style={{
                                        background:
                                            meta?.color ?? 'var(--accent-blue)',
                                    }}
                                />
                                <span className="min-w-0 text-left">
                                    <span className="block truncate text-xs font-medium">
                                        {taskTitle}
                                    </span>
                                    <span className="block truncate text-[11px] text-muted-foreground">
                                        {meta?.project.name ?? 'Projekt'}
                                    </span>
                                </span>
                            </span>
                            <Play className="h-3.5 w-3.5" />
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
