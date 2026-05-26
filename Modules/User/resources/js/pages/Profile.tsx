import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Briefcase,
    Calendar,
    Clock,
    Layers,
    Mail,
    Settings,
} from 'lucide-react';
import type { ElementType } from 'react';
import { useMemo, useState } from 'react';

interface ProfilePermission {
    value: string;
    label: string;
    description: string;
}

interface ProfileProject {
    id: number;
    name: string;
    permissions: string[];
    tasks_assigned: number;
    tasks_completed: number;
}

interface TimeTrackingSummary {
    total_hours_this_week: number;
    total_hours_this_month: number;
    recent_entries: {
        id: number;
        project_name: string;
        task_title: string;
        hours: number;
        entry_date: string;
        description: string | null;
    }[];
}

interface ProfilePageProps {
    user: {
        id: number;
        name: string;
        email: string;
        is_admin: boolean;
        created_at: string;
    };
    isOwnProfile: boolean;
    permissions: ProfilePermission[];
    projects: ProfileProject[];
    timeTracking: TimeTrackingSummary;
}

type ProfileTab = 'overview' | 'projects' | 'activity' | 'settings';

const monthTarget = 160;
const weekTarget = 40;

const initials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const formatMonthYear = (date: string) =>
    new Date(date).toLocaleDateString('sk-SK', {
        month: 'long',
        year: 'numeric',
    });

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('sk-SK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

const clampPercent = (value: number) => Math.max(0, Math.min(value, 100));

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="progress">
            <div
                className="progress__fill"
                style={{ width: `${clampPercent(value)}%` }}
            />
        </div>
    );
}

export default function Profile({
    user,
    isOwnProfile,
    permissions,
    projects,
    timeTracking,
}: ProfilePageProps) {
    const { props } = usePage<SharedData>();
    const [tab, setTab] = useState<ProfileTab>('overview');
    const canEditOwnProfile = Boolean(props.auth.user?.is_admin);
    const breadcrumbs: BreadcrumbItem[] = isOwnProfile
        ? [{ title: 'Môj profil', href: '/profile' }]
        : [
              { title: 'Používatelia', href: '/users' },
              { title: user.name, href: `/users/${user.id}` },
          ];

    const pageTitle = isOwnProfile ? 'Môj profil' : user.name;
    const totalAssigned = projects.reduce(
        (sum, project) => sum + project.tasks_assigned,
        0,
    );
    const totalCompleted = projects.reduce(
        (sum, project) => sum + project.tasks_completed,
        0,
    );
    const openTasks = Math.max(totalAssigned - totalCompleted, 0);
    const completionRate =
        totalAssigned > 0
            ? Math.round((totalCompleted / totalAssigned) * 100)
            : 0;
    const weekUtilization = Math.round(
        (timeTracking.total_hours_this_week / weekTarget) * 100,
    );

    const activityItems = useMemo(
        () =>
            timeTracking.recent_entries.map((entry) => ({
                id: entry.id,
                title: 'Zaznamenaný čas',
                target: `${entry.hours}h · ${entry.task_title}`,
                project: entry.project_name,
                when: formatDate(entry.entry_date),
                description: entry.description,
            })),
        [timeTracking.recent_entries],
    );

    const tabs: {
        id: ProfileTab;
        label: string;
        icon: ElementType;
        count?: number;
    }[] = [
        { id: 'overview', label: 'Prehľad', icon: Layers },
        {
            id: 'projects',
            label: isOwnProfile ? 'Moje projekty' : 'Projekty',
            icon: Briefcase,
            count: projects.length,
        },
        { id: 'activity', label: 'Aktivita', icon: Clock },
        { id: 'settings', label: 'Nastavenia', icon: Settings },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />

            <div className="page page-enter">
                <div className="profile-hero">
                    <div className="profile-hero__body">
                        <span className="avatar avatar--lg bg-pink-600">
                            {initials(user.name)}
                        </span>

                        <div className="profile-hero__main">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="page-head__title">
                                    {user.name}
                                </h1>
                                <span className="badge badge--success">
                                    Aktívny
                                </span>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                    <Mail className="h-4 w-4" />
                                    {user.email}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />V systéme od{' '}
                                    {formatMonthYear(user.created_at)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {isOwnProfile && canEditOwnProfile ? (
                                <Link
                                    href="/settings/profile"
                                    className="btn btn--primary"
                                >
                                    <Settings className="h-4 w-4" />
                                    Upraviť profil
                                </Link>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="kpi-grid">
                    <div className="kpi">
                        <span className="kpi__label">Aktívne projekty</span>
                        <span className="kpi__value">{projects.length}</span>
                        <span className="kpi__delta">
                            Projekty, v ktorých je používateľ členom
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Otvorené úlohy</span>
                        <span className="kpi__value">{openTasks}</span>
                        <span className="kpi__delta kpi__delta--up">
                            {totalCompleted} dokončených
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Hodiny tento mesiac</span>
                        <span className="kpi__value">
                            {timeTracking.total_hours_this_month}
                            <sub>h / {monthTarget}h</sub>
                        </span>
                        <div className="mt-3">
                            <ProgressBar
                                value={
                                    (timeTracking.total_hours_this_month /
                                        monthTarget) *
                                    100
                                }
                            />
                        </div>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Dokončenosť úloh</span>
                        <span className="kpi__value">
                            {completionRate}
                            <sub>%</sub>
                        </span>
                        <span className="kpi__delta">
                            {totalCompleted} z {totalAssigned} úloh
                        </span>
                    </div>
                </div>

                <div className="tabbar">
                    {tabs.map(({ id, label, icon: Icon, count }) => (
                        <button
                            key={id}
                            type="button"
                            className={`tab ${tab === id ? 'is-active' : ''}`}
                            onClick={() => setTab(id)}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                            {count !== undefined && (
                                <span className="tab__count">{count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {tab === 'overview' && (
                    <div className="grid-main-side">
                        <div className="col gap-5">
                            <section className="card">
                                <div className="card__head">
                                    <h2 className="card__title">O mne</h2>
                                </div>
                                <div className="card__body text-sm leading-6 text-muted-foreground">
                                    {user.name} je členom interného systému so
                                    zodpovednosťami naprieč projektmi a úlohami.
                                    Profil zobrazuje aktuálne projektové
                                    členstvá, aktivitu a evidovaný pracovný čas.
                                </div>
                            </section>

                            <ActivityCard activityItems={activityItems} />
                        </div>

                        <div className="col gap-4">
                            <section className="card">
                                <div className="card__head">
                                    <h2 className="card__title">Kontakt</h2>
                                </div>
                                <div className="card__body space-y-3 text-sm">
                                    <InfoRow
                                        label="E-mail"
                                        value={user.email}
                                    />
                                    <InfoRow
                                        label="Účet vytvorený"
                                        value={formatDate(user.created_at)}
                                    />
                                </div>
                            </section>

                            <section className="card">
                                <div className="card__head">
                                    <h2 className="card__title">
                                        Tento týždeň
                                    </h2>
                                </div>
                                <div className="card__body">
                                    <div className="mb-3 flex items-baseline gap-1">
                                        <span className="mono text-2xl font-semibold">
                                            {timeTracking.total_hours_this_week}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            z {weekTarget}h
                                        </span>
                                    </div>
                                    <ProgressBar value={weekUtilization} />
                                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                                        <span>Vyťaženie</span>
                                        <span>{weekUtilization}%</span>
                                    </div>
                                </div>
                            </section>

                            <section className="card">
                                <div className="card__head">
                                    <h2 className="card__title">
                                        Systémové oprávnenia
                                    </h2>
                                </div>
                                <div className="card__body">
                                    {permissions.length > 0 ? (
                                        <ul className="space-y-3">
                                            {permissions.map((permission) => (
                                                <li
                                                    key={permission.value}
                                                    className="rounded-md border border-border px-3 py-2"
                                                >
                                                    <div className="text-sm font-medium text-foreground">
                                                        {permission.label}
                                                    </div>
                                                    <div className="mt-1 text-xs leading-5 text-muted-foreground">
                                                        {permission.description}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Žiadne systémové oprávnenia.
                                        </p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {tab === 'projects' && <ProjectsTable projects={projects} />}

                {tab === 'activity' && (
                    <ActivityCard activityItems={activityItems} expanded />
                )}

                {tab === 'settings' && (
                    <div className="grid-main-side">
                        <section className="card">
                            <div className="card__head">
                                <h2 className="card__title">Profilové údaje</h2>
                            </div>
                            <div className="card__body grid gap-4 sm:grid-cols-2">
                                <ReadOnlyField label="Meno" value={user.name} />
                                <ReadOnlyField
                                    label="E-mail"
                                    value={user.email}
                                />
                                <ReadOnlyField
                                    label="Účet vytvorený"
                                    value={formatDate(user.created_at)}
                                />
                                <ReadOnlyField
                                    label="Aktívne projekty"
                                    value={String(projects.length)}
                                />
                            </div>
                        </section>

                        {isOwnProfile && (
                            <section className="card">
                                <div className="card__head">
                                    <h2 className="card__title">Bezpečnosť</h2>
                                </div>
                                <div className="card__body space-y-2">
                                    <Link
                                        href="/settings/password"
                                        className="btn w-full justify-start"
                                    >
                                        Zmeniť heslo
                                    </Link>
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{value}</span>
        </div>
    );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </span>
            <span className="text-sm text-foreground">{value}</span>
        </div>
    );
}

function ActivityCard({
    activityItems,
    expanded = false,
}: {
    activityItems: {
        id: number;
        title: string;
        target: string;
        project: string;
        when: string;
        description: string | null;
    }[];
    expanded?: boolean;
}) {
    const visibleItems = expanded ? activityItems : activityItems.slice(0, 4);

    return (
        <section className="card">
            <div className="card__head">
                <h2 className="card__title">Posledná aktivita</h2>
                {!expanded && activityItems.length > 4 && (
                    <button type="button" className="btn btn--ghost btn--sm">
                        Všetka aktivita
                        <ArrowRight className="h-3 w-3" />
                    </button>
                )}
            </div>
            <div className="card__body card__body--flush">
                {visibleItems.length > 0 ? (
                    visibleItems.map((item, index) => (
                        <div
                            key={item.id}
                            className={`flex gap-3 px-4 py-4 ${
                                index === 0 ? '' : 'border-t border-border'
                            }`}
                        >
                            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)]">
                                <Clock className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm">
                                    <span className="text-muted-foreground">
                                        {item.title}:{' '}
                                    </span>
                                    <span className="font-medium">
                                        {item.target}
                                    </span>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    {item.project} · {item.when}
                                    {item.description &&
                                        ` · ${item.description}`}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Zatiaľ tu nie je žiadna aktivita.
                    </div>
                )}
            </div>
        </section>
    );
}

function ProjectsTable({ projects }: { projects: ProfileProject[] }) {
    return (
        <section className="card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Projekt</th>
                            <th>Úlohy</th>
                            <th>Dokončené</th>
                            <th>Postup</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.length === 0 && (
                            <tr>
                                <td colSpan={5}>
                                    <div className="py-10 text-center text-sm text-muted-foreground">
                                        Používateľ nie je členom žiadneho
                                        projektu.
                                    </div>
                                </td>
                            </tr>
                        )}

                        {projects.map((project) => {
                            const progress =
                                project.tasks_assigned > 0
                                    ? Math.round(
                                          (project.tasks_completed /
                                              project.tasks_assigned) *
                                              100,
                                      )
                                    : 0;

                            return (
                                <tr key={project.id}>
                                    <td>
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {project.name}
                                        </Link>
                                    </td>
                                    <td className="mono text-sm">
                                        {project.tasks_assigned}
                                    </td>
                                    <td className="mono text-sm">
                                        {project.tasks_completed}
                                    </td>
                                    <td className="min-w-56">
                                        <div className="flex items-center gap-3">
                                            <ProgressBar value={progress} />
                                            <span className="mono min-w-9 text-xs text-muted-foreground">
                                                {progress}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="icon-btn ml-auto"
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
