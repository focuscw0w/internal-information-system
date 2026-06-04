import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import ManagerLayout from '@/layouts/manager-layout';
import { SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    CalendarDays,
    Check,
    CheckCheck,
    Clock,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

type TeamUtilizationWidget = {
    avg_utilization: number;
    overloaded_count: number;
    free_count: number;
};

type PendingApprovalsWidget = {
    count: number;
};

type PendingApprovalEntry = {
    id: number;
    entry_date: string | null;
    hours: number;
    description: string | null;
    user: { id: number | null; name: string; email: string | null };
    project: { id: number | null; name: string };
    task: { id: number | null; title: string };
};

type TeamMember = {
    id: number;
    name: string;
    weekly_capacity_hours: number;
    weekly_load_hours: number;
    weekly_utilization: number;
    free_capacity_hours: number;
    is_over_capacity: boolean;
    project_count?: number;
    projects?: TeamMemberProject[];
};

type TeamMemberProject = {
    id: number;
    name: string;
    allocation: number;
    weekly_hours: number;
    role: 'owner' | 'member';
};

type TeamProjectMember = TeamMember & {
    email: string | null;
    role: 'owner' | 'member' | 'unassigned';
    permissions: string[];
    project_allocation: number;
    project_weekly_hours: number;
    total_weekly_capacity_hours: number;
    total_weekly_load_hours: number;
    total_weekly_utilization: number;
};

type TeamProjectGroup = {
    id: number | null;
    name: string;
    status: string;
    progress: number;
    end_date: string | null;
    is_overdue: boolean;
    days_remaining: number;
    is_at_risk: boolean;
    members: TeamProjectMember[];
};

type TeamHoursWidget = {
    from: string;
    to: string;
    members: { user_id: number; name: string; hours: number }[];
};

type ManagerTask = {
    id: number;
    project_id: number;
    title: string;
    due_date: string | null;
    priority: string;
    project: { id: number; name: string };
};

type ManagerProject = {
    id: number;
    name: string;
    status: string;
    progress: number;
    end_date: string | null;
    is_overdue: boolean;
    days_remaining: number;
};

type ManagedProject = {
    id: number;
    name: string;
    status: string;
    progress: number;
    end_date: string | null;
    team_size: number;
    is_overdue: boolean;
    days_remaining: number;
    is_at_risk: boolean;
};

type Widgets = {
    teamUtilization?: TeamUtilizationWidget;
    pendingApprovals?: PendingApprovalsWidget;
    pendingApprovalEntries?: PendingApprovalEntry[];
    teamMembers?: TeamMember[];
    teamProjectGroups?: TeamProjectGroup[];
    overdueTasks?: ManagerTask[];
    atRiskProjects?: ManagerProject[];
    teamHoursThisWeek?: TeamHoursWidget;
    managedProjects?: ManagedProject[];
};

type DashboardProps = {
    widgets: Widgets;
};

type Tab = 'approvals' | 'team' | 'reports';

const has = (permissions: string[], permission: string, isAdmin: boolean) =>
    isAdmin || permissions.includes(permission);

const formatHours = (hours: number) =>
    new Intl.NumberFormat('sk-SK', { maximumFractionDigits: 1 }).format(hours);

const formatDate = (date: string | null) => {
    if (!date) return '-';

    return new Intl.DateTimeFormat('sk-SK', {
        day: 'numeric',
        month: 'short',
    }).format(new Date(date));
};

const initials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

function Avatar({
    name,
    size = 'default',
}: {
    name: string;
    size?: 'default' | 'sm';
}) {
    return (
        <span className={`avatar ${size === 'sm' ? 'avatar--sm' : ''}`}>
            {initials(name)}
        </span>
    );
}

function ProgressBar({ value }: { value: number }) {
    const tone =
        value > 100
            ? 'progress__fill--danger'
            : value >= 90
              ? 'progress__fill--warning'
              : 'progress__fill--success';

    return (
        <div className="progress">
            <div
                className={`progress__fill ${tone}`}
                style={{ width: `${Math.min(value, 100)}%` }}
            />
        </div>
    );
}

function ProjectStatusBadge({
    project,
}: {
    project: {
        status: string;
        is_overdue: boolean;
        is_at_risk?: boolean;
    };
}) {
    const isAtRisk = Boolean(project.is_at_risk);
    const cls = project.is_overdue
        ? 'badge--danger'
        : isAtRisk
          ? 'badge--warning'
          : 'badge--success';
    const label = project.is_overdue
        ? 'Po termíne'
        : isAtRisk
          ? 'Ohrozený'
          : project.status === 'active'
            ? 'Aktívny'
            : project.status;

    return <span className={`badge ${cls}`}>{label}</span>;
}

export default function Dashboard({ widgets }: DashboardProps) {
    const { props } = usePage<SharedData>();
    const permissions =
        (props.current_user_permissions as string[] | undefined) ?? [];
    const isAdmin = Boolean(props.auth.user?.is_admin);
    const canManageTime = has(permissions, 'manage_time_entries', isAdmin);
    const canManageTeam = has(permissions, 'manage_team', isAdmin);
    const canManageCapacity = has(permissions, 'capacity.manage', isAdmin);

    const [tab, setTab] = useState<Tab>('approvals');
    const [selected, setSelected] = useState<number[]>([]);
    const [rejectEntry, setRejectEntry] = useState<PendingApprovalEntry | null>(
        null,
    );
    const [rejectionReason, setRejectionReason] = useState('');

    const pendingEntries = widgets.pendingApprovalEntries ?? [];
    const selectedSet = useMemo(() => new Set(selected), [selected]);
    const allSelected =
        pendingEntries.length > 0 &&
        pendingEntries.every((entry) => selectedSet.has(entry.id));

    const teamRows = useMemo<TeamMember[]>(() => {
        if (widgets.teamMembers?.length) return widgets.teamMembers;

        return (widgets.teamHoursThisWeek?.members ?? []).map((member) => {
            const capacity = 40;
            const utilization = Math.round((member.hours / capacity) * 100);

            return {
                id: member.user_id,
                name: member.name,
                weekly_capacity_hours: capacity,
                weekly_load_hours: member.hours,
                weekly_utilization: utilization,
                free_capacity_hours: Math.max(capacity - member.hours, 0),
                is_over_capacity: utilization > 100,
            };
        });
    }, [widgets.teamHoursThisWeek?.members, widgets.teamMembers]);

    const totalTeamHours = teamRows.reduce(
        (sum, member) => sum + Number(member.weekly_load_hours),
        0,
    );
    const totalTeamCapacity = teamRows.reduce(
        (sum, member) => sum + Number(member.weekly_capacity_hours),
        0,
    );
    const teamUtilization =
        widgets.teamUtilization?.avg_utilization ??
        (totalTeamCapacity > 0
            ? Math.round((totalTeamHours / totalTeamCapacity) * 100)
            : 0);
    const atRiskCount = widgets.atRiskProjects?.length ?? 0;
    const overdueCount = widgets.overdueTasks?.length ?? 0;
    const managedProjects = widgets.managedProjects ?? [];
    const weekRange = widgets.teamHoursThisWeek
        ? `${formatDate(widgets.teamHoursThisWeek.from)} - ${formatDate(
              widgets.teamHoursThisWeek.to,
          )}`
        : 'Tento týždeň';

    const toggleAll = () => {
        setSelected(allSelected ? [] : pendingEntries.map((entry) => entry.id));
    };

    const toggleEntry = (id: number, checked: boolean) => {
        setSelected((current) =>
            checked
                ? [...current, id]
                : current.filter((entryId) => entryId !== id),
        );
    };

    const approve = (id: number) => {
        router.post(
            `/manager/time/approvals/${id}/approve`,
            {},
            { preserveScroll: true },
        );
    };

    const approveSelected = () => {
        if (selected.length === 0) return;

        router.post(
            '/manager/time/approvals/bulk',
            { ids: selected },
            {
                preserveScroll: true,
                onSuccess: () => setSelected([]),
            },
        );
    };

    const rejectSelectedEntry = () => {
        if (!rejectEntry || !rejectionReason.trim()) return;

        router.post(
            `/manager/time/approvals/${rejectEntry.id}/reject`,
            { rejection_reason: rejectionReason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRejectEntry(null);
                    setRejectionReason('');
                },
            },
        );
    };
    return (
        <ManagerLayout>
            <Head title="Manažérsky pohľad" />

            <div className="page page-enter">
                <div className="page-head">
                    <div>
                        <h1 className="page-head__title">Manažérsky pohľad</h1>
                        <p className="page-head__subtitle">
                            Schvaľuj výkazy svojho tímu a sleduj prehľad
                            projektov, na ktorých pracujú.
                        </p>
                    </div>
                    <div className="page-head__actions">
                        <span
                            className="btn cursor-default"
                            aria-label={`Obdobie: ${weekRange}`}
                        >
                            <CalendarDays className="size-4" />
                            {weekRange}
                        </span>
                    </div>
                </div>

                <div className="kpi-grid">
                    {canManageTime ? (
                        <KpiCard
                            label="Čaká na schválenie"
                            value={widgets.pendingApprovals?.count ?? 0}
                            suffix="položiek"
                            detail={`${selected.length} vybraných`}
                        />
                    ) : null}

                    {(canManageCapacity || canManageTime) && (
                        <KpiCard
                            label="Hodiny tímu (týždeň)"
                            value={formatHours(totalTeamHours)}
                            suffix={
                                totalTeamCapacity > 0
                                    ? `h / ${formatHours(totalTeamCapacity)}h`
                                    : 'h'
                            }
                        >
                            <ProgressBar value={teamUtilization} />
                        </KpiCard>
                    )}

                    {canManageCapacity ? (
                        <KpiCard
                            label="Vyťaženie tímu"
                            value={teamUtilization}
                            suffix="%"
                            detail={`${widgets.teamUtilization?.overloaded_count ?? 0} preťažení · ${widgets.teamUtilization?.free_count ?? 0} voľní`}
                            tone={teamUtilization > 100 ? 'down' : 'up'}
                        />
                    ) : null}

                    {canManageTeam ? (
                        <KpiCard
                            label="Projekty v ohrození"
                            value={atRiskCount}
                            suffix={`/ ${managedProjects.length}`}
                            detail={`${overdueCount} overdue úloh`}
                            tone={atRiskCount || overdueCount ? 'down' : 'up'}
                        />
                    ) : null}
                </div>

                <div className="tabbar mb-5">
                    <button
                        type="button"
                        className={`tab ${tab === 'approvals' ? 'is-active' : ''}`}
                        onClick={() => setTab('approvals')}
                    >
                        <CheckCheck className="size-4" />
                        Schvaľovania
                        <span className="tab__count">
                            {widgets.pendingApprovals?.count ?? 0}
                        </span>
                    </button>
                    <button
                        type="button"
                        className={`tab ${tab === 'team' ? 'is-active' : ''}`}
                        onClick={() => setTab('team')}
                    >
                        <Users className="size-4" />
                        Môj tím
                    </button>
                    <button
                        type="button"
                        className={`tab ${tab === 'reports' ? 'is-active' : ''}`}
                        onClick={() => setTab('reports')}
                    >
                        <TrendingUp className="size-4" />
                        Reporty
                    </button>
                </div>

                {tab === 'approvals' && canManageTime ? (
                    <ApprovalsPanel
                        entries={pendingEntries}
                        selectedSet={selectedSet}
                        selectedCount={selected.length}
                        allSelected={allSelected}
                        onToggleAll={toggleAll}
                        onToggleEntry={toggleEntry}
                        onApprove={approve}
                        onRejectRequest={setRejectEntry}
                        onApproveSelected={approveSelected}
                        onClearSelection={() => setSelected([])}
                    />
                ) : null}

                {tab === 'team' ? (
                    <TeamPanel
                        rows={teamRows}
                        groups={widgets.teamProjectGroups ?? []}
                        pendingCount={widgets.pendingApprovals?.count ?? 0}
                        overdueCount={overdueCount}
                        atRiskCount={atRiskCount}
                        onShowApprovals={() => setTab('approvals')}
                    />
                ) : null}

                {tab === 'reports' ? (
                    <ReportsPanel rows={teamRows} projects={managedProjects} />
                ) : null}
            </div>

            <Dialog
                open={!!rejectEntry}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejectEntry(null);
                        setRejectionReason('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Zamietnuť výkaz</DialogTitle>
                        <DialogDescription>
                            Dôvod sa uloží pri zázname a používateľ ho uvidí pri
                            oprave výkazu.
                        </DialogDescription>
                    </DialogHeader>
                    <textarea
                        className="textarea w-full"
                        value={rejectionReason}
                        onChange={(event) =>
                            setRejectionReason(event.target.value)
                        }
                        maxLength={500}
                        placeholder="Dôvod zamietnutia"
                    />
                    <DialogFooter>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => {
                                setRejectEntry(null);
                                setRejectionReason('');
                            }}
                        >
                            Zrušiť
                        </button>
                        <button
                            type="button"
                            className="btn btn--primary"
                            disabled={!rejectionReason.trim()}
                            onClick={rejectSelectedEntry}
                        >
                            Zamietnuť
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ManagerLayout>
    );
}

function KpiCard({
    label,
    value,
    suffix,
    detail,
    tone = 'neutral',
    children,
}: {
    label: string;
    value: string | number;
    suffix?: string;
    detail?: string;
    tone?: 'neutral' | 'up' | 'down';
    children?: ReactNode;
}) {
    return (
        <section className="kpi">
            <span className="kpi__label">{label}</span>
            <span className="kpi__value">
                {value}
                {suffix ? <sub>{suffix}</sub> : null}
            </span>
            {children ? <div className="mt-3">{children}</div> : null}
            {detail ? (
                <span
                    className={`kpi__delta ${
                        tone === 'up'
                            ? 'kpi__delta--up'
                            : tone === 'down'
                              ? 'kpi__delta--down'
                              : ''
                    }`}
                >
                    {detail}
                </span>
            ) : null}
        </section>
    );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-border bg-muted/30 p-3">
            <div className="mb-1 text-xs font-medium text-muted-foreground">
                {label}
            </div>
            <div className="text-base font-semibold">{value}</div>
        </div>
    );
}

function ApprovalsPanel({
    entries,
    selectedSet,
    selectedCount,
    allSelected,
    onToggleAll,
    onToggleEntry,
    onApprove,
    onRejectRequest,
    onApproveSelected,
    onClearSelection,
}: {
    entries: PendingApprovalEntry[];
    selectedSet: Set<number>;
    selectedCount: number;
    allSelected: boolean;
    onToggleAll: () => void;
    onToggleEntry: (id: number, checked: boolean) => void;
    onApprove: (id: number) => void;
    onRejectRequest: (entry: PendingApprovalEntry) => void;
    onApproveSelected: () => void;
    onClearSelection: () => void;
}) {
    const [detailEntry, setDetailEntry] = useState<PendingApprovalEntry | null>(
        null,
    );

    return (
        <>
            <section className="card">
                <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
                    <div>
                        <h3 className="card__title">Čakajúce výkazy času</h3>
                        <div className="card__sub">
                            {entries.length} záznamov na schválenie
                        </div>
                    </div>

                    <div className="flex-1" />

                    {selectedCount > 0 ? (
                        <>
                            <span className="text-xs text-muted-foreground">
                                Vybraných {selectedCount}
                            </span>
                            <button
                                type="button"
                                className="btn btn--sm btn--ghost"
                                onClick={onClearSelection}
                            >
                                Zrušiť výber
                            </button>
                            <button
                                type="button"
                                className="btn btn--sm btn--primary"
                                onClick={onApproveSelected}
                            >
                                <Check className="size-3.5" />
                                Schváliť ({selectedCount})
                            </button>
                        </>
                    ) : null}
                </div>

                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="w-10">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={onToggleAll}
                                        aria-label="Vybrať všetky výkazy"
                                    />
                                </th>
                                <th>Položka</th>
                                <th>Projekt</th>
                                <th>Úloha</th>
                                <th>Obdobie</th>
                                <th className="text-right">Hodiny</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => {
                                const selected = selectedSet.has(entry.id);

                                return (
                                    <tr
                                        key={entry.id}
                                        className={`cursor-pointer ${selected ? 'bg-accent/60' : ''}`}
                                        onClick={() => setDetailEntry(entry)}
                                    >
                                        <td
                                            onClick={(event) =>
                                                event.stopPropagation()
                                            }
                                        >
                                            <Checkbox
                                                checked={selected}
                                                onCheckedChange={(checked) =>
                                                    onToggleEntry(
                                                        entry.id,
                                                        checked === true,
                                                    )
                                                }
                                                aria-label={`Vybrať výkaz ${entry.user.name}`}
                                            />
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={entry.user.name}
                                                />
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium">
                                                        {entry.user.name}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--accent-blue-text)]">
                                                        <Clock className="size-3.5" />
                                                        Výkaz času
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="max-w-48 truncate">
                                            {entry.project.name}
                                        </td>
                                        <td className="max-w-64 truncate text-muted-foreground">
                                            {entry.task.title}
                                        </td>
                                        <td className="mono text-xs text-muted-foreground">
                                            {formatDate(entry.entry_date)}
                                        </td>
                                        <td className="mono text-right text-sm font-semibold">
                                            {formatHours(entry.hours)}h
                                        </td>
                                        <td>
                                            <div
                                                className="flex justify-end gap-1"
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className="icon-btn text-[var(--success-text)]"
                                                    title="Schváliť"
                                                    onClick={() =>
                                                        onApprove(entry.id)
                                                    }
                                                >
                                                    <Check className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="icon-btn text-[var(--danger-text)]"
                                                    title="Zamietnuť"
                                                    onClick={() =>
                                                        onRejectRequest(entry)
                                                    }
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {entries.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-12 text-center text-muted-foreground"
                                    >
                                        <CheckCheck className="mx-auto mb-2 size-8 text-[var(--success-text)]" />
                                        <div className="font-medium text-foreground">
                                            Všetko schválené
                                        </div>
                                        <div className="mt-1 text-sm">
                                            Žiadne čakajúce výkazy.
                                        </div>
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </section>

            <Dialog
                open={detailEntry !== null}
                onOpenChange={(open) => {
                    if (!open) setDetailEntry(null);
                }}
            >
                {detailEntry && (
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <div className="flex items-start gap-3 pr-8">
                                <Avatar name={detailEntry.user.name} />
                                <div>
                                    <DialogTitle>
                                        Výkaz času - {detailEntry.user.name}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {detailEntry.project.name} ·{' '}
                                        {formatDate(detailEntry.entry_date)}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <DetailMetric
                                label="Používateľ"
                                value={detailEntry.user.name}
                            />
                            <DetailMetric
                                label="Hodiny"
                                value={`${formatHours(detailEntry.hours)}h`}
                            />
                            <DetailMetric
                                label="Projekt"
                                value={detailEntry.project.name}
                            />
                            <DetailMetric
                                label="Úloha"
                                value={detailEntry.task.title}
                            />
                        </div>

                        <div className="rounded-md border border-border bg-muted/30 p-3">
                            <div className="mb-1 text-xs font-medium text-muted-foreground">
                                Popis práce
                            </div>
                            <p className="text-sm">
                                {detailEntry.description || 'Bez popisu'}
                            </p>
                        </div>

                        <DialogFooter>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => {
                                    onRejectRequest(detailEntry);
                                    setDetailEntry(null);
                                }}
                            >
                                <X className="size-4" />
                                Zamietnuť
                            </button>
                            <button
                                type="button"
                                className="btn btn--primary"
                                onClick={() => {
                                    onApprove(detailEntry.id);
                                    setDetailEntry(null);
                                }}
                            >
                                <Check className="size-4" />
                                Schváliť
                            </button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </>
    );
}

function TeamPanel({
    rows,
    groups,
    pendingCount,
    overdueCount,
    atRiskCount,
    onShowApprovals,
}: {
    rows: TeamMember[];
    groups: TeamProjectGroup[];
    pendingCount: number;
    overdueCount: number;
    atRiskCount: number;
    onShowApprovals: () => void;
}) {
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(
        null,
    );
    const [viewMode, setViewMode] = useState<'projects' | 'people'>('projects');
    const projectMembershipCount = groups.reduce(
        (sum, group) => sum + group.members.length,
        0,
    );
    return (
        <>
            <div className="grid-main-side">
                <section className="card">
                    <div className="card__head">
                        <div>
                            <h3 className="card__title">Vyťaženie tímu</h3>
                            <div className="card__sub">
                                {viewMode === 'projects'
                                    ? `${groups.length} projektov · ${projectMembershipCount} zaradení`
                                    : `${rows.length} ľudí · tento týždeň`}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="tabbar mb-0">
                                <button
                                    type="button"
                                    className={`tab ${viewMode === 'projects' ? 'is-active' : ''}`}
                                    onClick={() => setViewMode('projects')}
                                >
                                    Podľa projektov
                                </button>
                                <button
                                    type="button"
                                    className={`tab ${viewMode === 'people' ? 'is-active' : ''}`}
                                    onClick={() => setViewMode('people')}
                                >
                                    Podľa ľudí
                                </button>
                            </div>
                        </div>
                    </div>

                    {viewMode === 'projects' ? (
                        <ProjectTeamTable
                            groups={groups}
                            onSelectMember={setSelectedMember}
                        />
                    ) : (
                        <PeopleTeamTable
                            rows={rows}
                            onSelectMember={setSelectedMember}
                        />
                    )}
                </section>

                <aside className="col gap-4">
                    <section className="card">
                        <div className="card__head">
                            <h3 className="card__title">Upozornenia</h3>
                        </div>
                        <div className="card__body space-y-3">
                            <AlertItem
                                tone="warning"
                                title={`${atRiskCount} rizikových projektov`}
                                subtitle="Projekty, ktoré potrebujú kontrolu plánu"
                            />
                            <AlertItem
                                tone="danger"
                                title={`${overdueCount} overdue úloh`}
                                subtitle="Najstaršie položky v manažovaných projektoch"
                            />
                            <AlertItem
                                tone="accent"
                                title={`${pendingCount} výkazov čaká`}
                                subtitle="Schváľ alebo otvor detailnú frontu"
                            />
                        </div>
                    </section>

                    <section className="card">
                        <div className="card__head">
                            <h3 className="card__title">Rýchle akcie</h3>
                        </div>
                        <div className="card__body flex flex-col gap-2">
                            <button
                                type="button"
                                className="btn btn--ghost justify-start"
                                onClick={onShowApprovals}
                            >
                                <CheckCheck className="size-4" />
                                Schváliť výkazy
                            </button>
                            <Link
                                href="/manager/time/reports"
                                className="btn btn--ghost justify-start"
                            >
                                <BarChart3 className="size-4" />
                                Otvoriť reporty
                            </Link>
                            <Link
                                href="/users"
                                className="btn btn--ghost justify-start"
                            >
                                <Users className="size-4" />
                                Otvoriť tím
                            </Link>
                        </div>
                    </section>
                </aside>
            </div>

            <Dialog
                open={selectedMember !== null}
                onOpenChange={(open) => {
                    if (!open) setSelectedMember(null);
                }}
            >
                {selectedMember && (
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <div className="flex items-start gap-3 pr-8">
                                <Avatar name={selectedMember.name} />
                                <div>
                                    <DialogTitle>
                                        {selectedMember.name}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Tímová kapacita a vyťaženie za aktuálny
                                        týždeň
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <DetailMetric
                                label="Odpracované hodiny"
                                value={`${formatHours(
                                    selectedMember.weekly_load_hours,
                                )}h`}
                            />
                            <DetailMetric
                                label="Týždenná kapacita"
                                value={`${formatHours(
                                    selectedMember.weekly_capacity_hours,
                                )}h`}
                            />
                            <DetailMetric
                                label="Vyťaženie"
                                value={`${Math.round(
                                    selectedMember.weekly_utilization,
                                )}%`}
                            />
                            <DetailMetric
                                label="Voľná kapacita"
                                value={
                                    selectedMember.is_over_capacity
                                        ? 'Nad kapacitou'
                                        : `${formatHours(
                                              selectedMember.free_capacity_hours,
                                          )}h`
                                }
                            />
                        </div>

                        {selectedMember.projects?.length ? (
                            <div>
                                <div className="mb-2 text-sm font-medium">
                                    Projekty
                                </div>
                                <div className="space-y-2">
                                    {selectedMember.projects.map((project) => (
                                        <div
                                            key={project.id}
                                            className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                                        >
                                            <div>
                                                <div className="font-medium">
                                                    {project.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {project.role === 'owner'
                                                        ? 'Vlastník'
                                                        : 'Člen tímu'}{' '}
                                                    · {project.allocation}%
                                                    alokácia
                                                </div>
                                            </div>
                                            <span className="mono text-xs">
                                                {formatHours(
                                                    project.weekly_hours,
                                                )}
                                                h
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div>
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="font-medium">
                                    Využitie kapacity
                                </span>
                                <span className="mono text-xs text-muted-foreground">
                                    {Math.round(
                                        selectedMember.weekly_utilization,
                                    )}
                                    %
                                </span>
                            </div>
                            <ProgressBar
                                value={selectedMember.weekly_utilization}
                            />
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </>
    );
}

function ProjectTeamTable({
    groups,
    onSelectMember,
}: {
    groups: TeamProjectGroup[];
    onSelectMember: (member: TeamMember) => void;
}) {
    return (
        <div className="space-y-5">
            {groups.map((group) => (
                <div
                    key={group.id ?? 'unassigned'}
                    className="rounded-md border border-border"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold">
                                    {group.name}
                                </h4>
                                {group.id !== null ? (
                                    <ProjectStatusBadge project={group} />
                                ) : (
                                    <span className="badge badge--neutral">
                                        Bez projektu
                                    </span>
                                )}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                {group.members.length} členov
                                {group.end_date
                                    ? ` · deadline ${formatDate(group.end_date)}`
                                    : ''}
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Člen tímu</th>
                                    <th>Rola</th>
                                    <th>Alokácia</th>
                                    <th className="w-64">
                                        Projektové vyťaženie
                                    </th>
                                    <th>Hodiny / alokácia</th>
                                    <th>Celkové vyťaženie</th>
                                </tr>
                            </thead>
                            <tbody>
                                {group.members.map((member) => (
                                    <tr
                                        key={`${group.id ?? 'unassigned'}-${member.id}`}
                                        className="cursor-pointer"
                                        onClick={() => onSelectMember(member)}
                                    >
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <Avatar name={member.name} />
                                                <span className="font-medium">
                                                    {member.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge--neutral">
                                                {member.role === 'owner'
                                                    ? 'Vlastník'
                                                    : member.role ===
                                                        'unassigned'
                                                      ? 'Bez projektu'
                                                      : 'Člen'}
                                            </span>
                                        </td>
                                        <td className="mono text-xs">
                                            {member.project_allocation}%
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="min-w-32 flex-1">
                                                    <ProgressBar
                                                        value={
                                                            member.weekly_utilization
                                                        }
                                                    />
                                                </div>
                                                <span
                                                    className={`mono min-w-11 text-right text-xs font-semibold ${
                                                        member.is_over_capacity
                                                            ? 'text-[var(--danger-text)]'
                                                            : ''
                                                    }`}
                                                >
                                                    {Math.round(
                                                        member.weekly_utilization,
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                        </td>
                                        <td className="mono text-xs">
                                            {formatHours(
                                                member.project_weekly_hours,
                                            )}
                                            h{' '}
                                            <span className="text-muted-foreground">
                                                /{' '}
                                                {formatHours(
                                                    member.weekly_capacity_hours,
                                                )}
                                                h
                                            </span>
                                        </td>
                                        <td className="mono text-xs">
                                            {Math.round(
                                                member.total_weekly_utilization,
                                            )}
                                            %
                                        </td>
                                    </tr>
                                ))}
                                {group.members.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            Projekt zatiaľ nemá členov tímu.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
            {groups.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                    Zatiaľ tu nie sú tímové dáta.
                </div>
            ) : null}
        </div>
    );
}

function PeopleTeamTable({
    rows,
    onSelectMember,
}: {
    rows: TeamMember[];
    onSelectMember: (member: TeamMember) => void;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="table">
                <thead>
                    <tr>
                        <th>Člen tímu</th>
                        <th>Projekty</th>
                        <th className="w-64">Vyťaženie</th>
                        <th>Hodiny / cieľ</th>
                        <th>Voľná kapacita</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((member) => (
                        <tr
                            key={member.id}
                            className="cursor-pointer"
                            onClick={() => onSelectMember(member)}
                        >
                            <td>
                                <div className="flex items-center gap-3">
                                    <Avatar name={member.name} />
                                    <span className="font-medium">
                                        {member.name}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <span className="badge badge--neutral">
                                    {member.project_count ?? 0}
                                </span>
                            </td>
                            <td>
                                <div className="flex items-center gap-3">
                                    <div className="min-w-32 flex-1">
                                        <ProgressBar
                                            value={member.weekly_utilization}
                                        />
                                    </div>
                                    <span
                                        className={`mono min-w-11 text-right text-xs font-semibold ${
                                            member.is_over_capacity
                                                ? 'text-[var(--danger-text)]'
                                                : ''
                                        }`}
                                    >
                                        {Math.round(member.weekly_utilization)}%
                                    </span>
                                </div>
                            </td>
                            <td className="mono text-xs">
                                {formatHours(member.weekly_load_hours)}h{' '}
                                <span className="text-muted-foreground">
                                    /{' '}
                                    {formatHours(member.weekly_capacity_hours)}h
                                </span>
                            </td>
                            <td>
                                <span
                                    className={`badge ${
                                        member.is_over_capacity
                                            ? 'badge--danger'
                                            : member.free_capacity_hours >= 8
                                              ? 'badge--success'
                                              : 'badge--neutral'
                                    }`}
                                >
                                    {member.is_over_capacity
                                        ? 'Nad kapacitou'
                                        : `${formatHours(member.free_capacity_hours)}h`}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="py-10 text-center text-muted-foreground"
                            >
                                Zatiaľ tu nie sú tímové dáta.
                            </td>
                        </tr>
                    ) : null}
                </tbody>
            </table>
        </div>
    );
}

function ReportsPanel({
    rows,
    projects,
}: {
    rows: TeamMember[];
    projects: ManagedProject[];
}) {
    const maxHours = Math.max(...rows.map((row) => row.weekly_load_hours), 1);

    return (
        <div className="col gap-5 [&>*]:min-w-0">
            <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-[minmax(0,1fr)_320px]">
                <section className="card">
                    <div className="card__head">
                        <div>
                            <h3 className="card__title">Hodiny tímu</h3>
                            <div className="card__sub">
                                Aktuálny týždeň podľa členov
                            </div>
                        </div>
                        <Link
                            href="/manager/time/reports"
                            className="btn btn--primary h-10 px-4 text-sm"
                        >
                            Detail reportov
                        </Link>
                    </div>
                    <div className="card__body">
                        <div className="flex h-64 items-end gap-4">
                            {rows.slice(0, 8).map((row) => (
                                <div
                                    key={row.id}
                                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                                >
                                    <span className="mono text-[11px] text-muted-foreground">
                                        {formatHours(row.weekly_load_hours)}h
                                    </span>
                                    <div
                                        className="w-full max-w-12 rounded-t bg-[var(--accent-blue)]"
                                        style={{
                                            height: `${Math.max(
                                                (row.weekly_load_hours /
                                                    maxHours) *
                                                    100,
                                                4,
                                            )}%`,
                                        }}
                                    />
                                    <span className="w-full truncate text-center text-xs">
                                        {row.name}
                                    </span>
                                </div>
                            ))}
                            {rows.length === 0 ? (
                                <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
                                    Bez dát za obdobie.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="card">
                    <div className="card__head">
                        <h3 className="card__title">Top projekty</h3>
                    </div>
                    <div className="card__body space-y-3">
                        {projects.slice(0, 5).map((project) => (
                            <div key={project.id}>
                                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                    <span className="truncate font-medium">
                                        {project.name}
                                    </span>
                                    <span className="mono text-xs text-muted-foreground">
                                        {project.progress}%
                                    </span>
                                </div>
                                <ProgressBar value={project.progress} />
                            </div>
                        ))}
                        {projects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Žiadne projekty v správe.
                            </p>
                        ) : null}
                    </div>
                </section>
            </div>

            <section className="card">
                <div className="card__head">
                    <div>
                        <h3 className="card__title">Projekty v správe</h3>
                        <div className="card__sub">
                            Progress, tím a delivery termíny
                        </div>
                    </div>
                    <Link href="/projects" className="btn btn--sm">
                        Všetky projekty
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Projekt</th>
                                <th className="w-64">Progress</th>
                                <th>Tím</th>
                                <th>Delivery</th>
                                <th>Stav</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.id}>
                                    <td>
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {project.name}
                                        </Link>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="min-w-32 flex-1">
                                                <ProgressBar
                                                    value={project.progress}
                                                />
                                            </div>
                                            <span className="mono min-w-10 text-right text-xs font-semibold">
                                                {project.progress}%
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge--neutral">
                                            {project.team_size} ľudí
                                        </span>
                                    </td>
                                    <td className="mono text-xs">
                                        {formatDate(project.end_date)}
                                    </td>
                                    <td>
                                        <ProjectStatusBadge project={project} />
                                    </td>
                                </tr>
                            ))}
                            {projects.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-10 text-center text-muted-foreground"
                                    >
                                        Žiadne aktívne projekty v správe.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function AlertItem({
    tone,
    title,
    subtitle,
}: {
    tone: 'danger' | 'warning' | 'accent';
    title: string;
    subtitle: string;
}) {
    const color =
        tone === 'danger'
            ? 'var(--danger)'
            : tone === 'warning'
              ? 'var(--warning)'
              : 'var(--accent-blue)';

    return (
        <div className="flex gap-3 rounded-md bg-muted/60 px-3 py-2.5">
            <span
                className="w-1 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
            />
            <div>
                <div className="text-sm font-medium">{title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                    {subtitle}
                </div>
            </div>
        </div>
    );
}
