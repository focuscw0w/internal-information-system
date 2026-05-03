import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Check,
    Download,
    MoreHorizontal,
    Pause,
    Play,
    Plus,
    Send,
} from 'lucide-react';
import { Project } from 'Modules/Project/resources/js/types/types';
import { TimeEntry } from '../types/types';
import { BreadcrumbItem } from '@/types';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

interface IndexProps {
    projects: Project[];
    entries: TimeEntry[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Evidencia času', href: '/time-tracking' },
];

const projectColors = [
    '#6366f1',
    '#0ea5e9',
    '#10b981',
    '#94a3b8',
    '#d97706',
];

const formatHours = (hours: number) =>
    Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;

const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const dateKey = (value: string) => value.substring(0, 10);

export default function Index({ projects, entries }: IndexProps) {
    const [view, setView] = useState<'week' | 'month'>('week');
    const [running, setRunning] = useState(false);
    const [elapsed, setElapsed] = useState(2734);
    const [selectedProjectId, setSelectedProjectId] = useState<number | ''>(
        projects[0]?.id ?? '',
    );

    useEffect(() => {
        if (!running) return;
        const timer = window.setInterval(
            () => setElapsed((current) => current + 1),
            1000,
        );
        return () => window.clearInterval(timer);
    }, [running]);

    const projectById = useMemo(
        () => new Map(projects.map((project, index) => [project.id, {
            project,
            color: projectColors[index % projectColors.length],
        }])),
        [projects],
    );

    const totalHours = entries.reduce(
        (sum, entry) => sum + Number(entry.hours),
        0,
    );
    const billableHours = Math.round(totalHours * 0.9);
    const weekTarget = 40;
    const monthTarget = 168;

    const entriesByDate = entries.reduce<Record<string, TimeEntry[]>>(
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

    const weekDays = buildWeekDays(entries);
    const maxDayHours = Math.max(10, ...weekDays.map((day) => day.hours));

    const breakdown = projects
        .map((project, index) => {
            const hours = entries
                .filter((entry) => entry.project_id === project.id)
                .reduce((sum, entry) => sum + Number(entry.hours), 0);
            return {
                project,
                hours,
                color: projectColors[index % projectColors.length],
            };
        })
        .filter((item) => item.hours > 0);

    const selectedProject =
        selectedProjectId === ''
            ? projects[0]
            : projects.find((project) => project.id === selectedProjectId);
    const selectedTask = selectedProject?.tasks?.[0];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Evidencia času" />

            <div className="page page-enter">
                <div className="page-head">
                    <div>
                        <h1 className="page-head__title">Evidencia času</h1>
                        <p className="page-head__subtitle">
                            Sleduj hodiny strávené na projektoch. Týždeň{' '}
                            <strong className="font-semibold text-foreground">
                                27. apr - 3. máj 2026
                            </strong>
                        </p>
                    </div>
                    <div className="page-head__actions">
                        <button type="button" className="btn">
                            <Download className="h-4 w-4" />
                            Export CSV
                        </button>
                        <button type="button" className="btn">
                            <Send className="h-4 w-4" />
                            Odoslať na schválenie
                        </button>
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
                            onClick={() => setRunning((current) => !current)}
                            className="inline-flex size-12 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-colors"
                            style={{
                                background: running
                                    ? 'var(--danger)'
                                    : 'var(--accent-blue)',
                                boxShadow: running
                                    ? '0 0 0 4px var(--danger-soft)'
                                    : '0 0 0 4px var(--accent-blue-soft)',
                            }}
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
                                value={selectedProjectId}
                                onChange={(event) =>
                                    setSelectedProjectId(
                                        event.target.value
                                            ? Number(event.target.value)
                                            : '',
                                    )
                                }
                            >
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                            <select className="select w-full" disabled={!selectedProject}>
                                {selectedProject?.tasks?.length ? (
                                    selectedProject.tasks.map((task) => (
                                        <option key={task.id} value={task.id}>
                                            {task.title}
                                        </option>
                                    ))
                                ) : (
                                    <option>
                                        {selectedTask?.title ?? 'Bez úlohy'}
                                    </option>
                                )}
                            </select>
                            <input
                                className="input w-full"
                                placeholder="Krátka poznámka (voliteľné)..."
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

                <div className="kpi-grid">
                    <KpiProgress
                        label="Tento týždeň"
                        value={formatHours(totalHours)}
                        suffix="/ 40h"
                        progress={(totalHours / weekTarget) * 100}
                    />
                    <div className="kpi">
                        <span className="kpi__label">Účtovateľné</span>
                        <span className="kpi__value">
                            {billableHours}
                            <sub>h ({totalHours ? Math.round((billableHours / totalHours) * 100) : 0}%)</sub>
                        </span>
                        <span className="kpi__delta kpi__delta--up">
                            +4h vs minulý týždeň
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Priemer / deň</span>
                        <span className="kpi__value">
                            {(totalHours / Math.max(1, sortedDates.length)).toFixed(1)}
                            <sub>h</sub>
                        </span>
                        <span className="kpi__delta">Cieľ: 8h / deň</span>
                    </div>
                    <KpiProgress
                        label="Tento mesiac"
                        value={formatHours(Math.round(totalHours * 4.6))}
                        suffix="/ 168h"
                        progress={((totalHours * 4.6) / monthTarget) * 100}
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
                                                key={day.key}
                                                className="flex h-full flex-1 flex-col items-center gap-2"
                                            >
                                                <div className="flex w-full flex-1 flex-col items-center justify-end">
                                                    <span className="mono mb-1 text-xs text-muted-foreground">
                                                        {day.hours
                                                            ? formatHours(day.hours)
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
                                                        {day.shortDate}
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
                                        {entries.length} záznamov, celkom{' '}
                                        {formatHours(totalHours)}
                                    </div>
                                </div>
                                <div className="command-bar__filters">
                                    <select className="select text-xs">
                                        <option>Všetky projekty</option>
                                        {projects.map((project) => (
                                            <option key={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button type="button" className="btn btn--primary btn--sm">
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
                            totalHours={totalHours}
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

function buildWeekDays(entries: TimeEntry[]) {
    const days = [
        ['Po', '27.4.'],
        ['Ut', '28.4.'],
        ['St', '29.4.'],
        ['Št', '30.4.'],
        ['Pi', '1.5.'],
        ['So', '2.5.'],
        ['Ne', '3.5.'],
    ] as const;

    return days.map(([label, shortDate], index) => {
        const dayHours = entries
            .filter((entry) => new Date(entry.entry_date).getDay() === ((index + 1) % 7))
            .reduce((sum, entry) => sum + Number(entry.hours), 0);
        return {
            key: `${label}-${shortDate}`,
            label,
            shortDate,
            hours: dayHours,
        };
    });
}

function DayGroup({
    date,
    entries,
    projectById,
}: {
    date: string;
    entries: TimeEntry[];
    projectById: Map<number, { project: Project; color: string }>;
}) {
    const total = entries.reduce((sum, entry) => sum + Number(entry.hours), 0);
    const dateObject = new Date(date);
    const dayLabel = ['Ne', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So'][dateObject.getDay()];

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
                        className="grid grid-cols-[4px_minmax(0,1fr)_auto_auto_auto] items-center gap-4 border-b border-border px-5 py-3"
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
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                                {projectMeta?.project.name ?? 'Projekt'}{' '}
                                {entry.description
                                    ? `· ${entry.description}`
                                    : ''}
                            </div>
                        </div>
                        <span className="badge badge--neutral">
                            Účtovateľné
                        </span>
                        <span className="badge badge--success">
                            <Check className="h-3 w-3" />
                            Schválené
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="mono text-sm font-semibold">
                                {formatHours(Number(entry.hours))}
                            </span>
                            <button type="button" className="icon-btn">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function QuickAddCard({ projects }: { projects: Project[] }) {
    const firstProject = projects[0];
    return (
        <section className="card">
            <div className="card__head">
                <h3 className="card__title">Pridať záznam</h3>
            </div>
            <div className="card__body space-y-3">
                <FormField label="Projekt">
                    <select className="select w-full" defaultValue={firstProject?.id}>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </FormField>
                <FormField label="Úloha">
                    <select className="select w-full">
                        {firstProject?.tasks?.length ? (
                            firstProject.tasks.map((task) => (
                                <option key={task.id}>{task.title}</option>
                            ))
                        ) : (
                            <option>Bez úlohy</option>
                        )}
                    </select>
                </FormField>
                <div className="grid grid-cols-2 gap-2">
                    <FormField label="Dátum">
                        <input type="date" className="input w-full" />
                    </FormField>
                    <FormField label="Hodiny">
                        <input
                            type="number"
                            className="input w-full"
                            defaultValue={2}
                            step={0.25}
                        />
                    </FormField>
                </div>
                <FormField label="Poznámka">
                    <textarea
                        className="textarea min-h-16 w-full"
                        placeholder="Čo si robil..."
                    />
                </FormField>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" defaultChecked />
                    Účtovateľná položka
                </label>
                <button type="button" className="btn btn--primary w-full">
                    <Plus className="h-4 w-4" />
                    Uložiť záznam
                </button>
            </div>
        </section>
    );
}

function FormField({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {label}
            </span>
            {children}
        </label>
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
    return (
        <section className="card">
            <div className="card__head">
                <h3 className="card__title">Naposledy použité</h3>
            </div>
            <div className="card__body space-y-1.5">
                {entries.map((entry) => {
                    const meta = projectById.get(entry.project_id);
                    return (
                        <button
                            key={entry.id}
                            type="button"
                            className="btn btn--ghost w-full justify-between px-2"
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
                                        {entry.task?.title ?? 'Bez úlohy'}
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
