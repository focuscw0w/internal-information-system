import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    BriefcaseBusiness,
    CheckCircle2,
    Clock3,
    Crown,
    Plus,
    ShieldCheck,
    UserRound,
    Users,
} from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { Project, TeamMember } from '../../../types/types';
import { RemoveTeamMemberDialog } from '../dialogs/team/delete-team-member';
import { EditTeamMemberDialog } from '../dialogs/team/edit-team-member';
import { ManageTeamDialog } from '../dialogs/team/manage-team';
import { PERMISSION_GROUPS, PERMISSION_LABELS } from '../utils/permissions';

interface TeamProps {
    project: Project;
}

type TeamTableMember = TeamMember & {
    isOwner?: boolean;
};

type TeamMemberStats = {
    assignedTasks: number;
    allocation: number;
    weeklyCapacity: number;
    weeklyLoad: number;
    utilization: number;
};

const initials = (name: string): string =>
    name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const clampPercent = (value: number): number =>
    Math.max(0, Math.min(value, 100));

const formatHours = (hours: number): string =>
    Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);

export const Team = ({ project }: TeamProps) => {
    const [selectedMember, setSelectedMember] =
        useState<TeamTableMember | null>(null);
    const permissions = project.current_user_permissions ?? [];
    const can = (permission: string) => permissions.includes(permission);

    const teamMembers = useMemo<TeamTableMember[]>(() => {
        const owner = project.owner;
        const members: TeamTableMember[] = (project.team ?? []).map(
            (member) => ({
                ...member,
                isOwner: owner?.id === member.id,
            }),
        );

        if (owner && !members.some((member) => member.id === owner.id)) {
            const ownerAllocation = project.allocations?.find(
                (allocation) => allocation.user_id === owner.id,
            );

            members.unshift({
                id: owner.id,
                name: owner.name,
                email: owner.email,
                permissions: PERMISSION_GROUPS.flatMap((group) =>
                    group.permissions.map((permission) => permission.value),
                ),
                allocation: ownerAllocation?.percentage ?? 100,
                isOwner: true,
            });
        }

        return members;
    }, [project.allocations, project.owner, project.team]);

    const statsByMember = useMemo(
        () =>
            teamMembers.reduce<Record<number, TeamMemberStats>>(
                (acc, member) => {
                    const allocation = project.allocations?.find(
                        (item) => item.user_id === member.id,
                    );
                    const assignedTasks =
                        project.tasks?.filter((task) =>
                            task.assigned_users?.some(
                                (assignee) => assignee.id === member.id,
                            ),
                        ).length ?? 0;
                    const weeklyCapacity = Number(
                        member.weekly_capacity_hours ??
                            allocation?.allocated_hours ??
                            40,
                    );
                    const weeklyLoad = Number(
                        member.weekly_load_hours ?? allocation?.used_hours ?? 0,
                    );
                    const calculatedUtilization =
                        weeklyCapacity > 0
                            ? Math.round((weeklyLoad / weeklyCapacity) * 100)
                            : 0;

                    acc[member.id] = {
                        assignedTasks,
                        allocation: Number(
                            member.allocation ?? allocation?.percentage ?? 100,
                        ),
                        weeklyCapacity,
                        weeklyLoad,
                        utilization: Math.round(
                            Number(
                                member.weekly_utilization ??
                                    calculatedUtilization,
                            ),
                        ),
                    };

                    return acc;
                },
                {},
            ),
        [project.allocations, project.tasks, teamMembers],
    );

    const selectedStats = selectedMember
        ? statsByMember[selectedMember.id]
        : null;

    if (teamMembers.length === 0) {
        return (
            <Card className="card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">
                        Žiadni členovia tímu
                    </h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Zatiaľ nie sú pridaní žiadni členovia do tímu projektu.
                    </p>
                    {can('manage_team') && (
                        <ManageTeamDialog project={project} />
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="card">
                <CardHeader className="border-b border-border px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <CardTitle className="card__title">
                                Tím projektu
                            </CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {teamMembers.length} členov · vyťaženosť za
                                tento týždeň
                            </p>
                        </div>
                        {can('manage_team') && (
                            <ManageTeamDialog
                                project={project}
                                trigger={
                                    <Button size="sm">
                                        <Plus className="h-4 w-4" />
                                        Pridať člena
                                    </Button>
                                }
                            />
                        )}
                    </div>
                </CardHeader>
                <CardContent className="card__body card__body--flush overflow-x-auto">
                    <table className="table min-w-[840px]">
                        <thead>
                            <tr>
                                <th>Člen</th>
                                <th>Vyťaženie</th>
                                <th>Pridelené úlohy</th>
                                <th>Hodiny tento týždeň</th>
                                <th className="text-right">Akcie</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamMembers.map((member) => {
                                const stats = statsByMember[member.id];
                                const utilization = clampPercent(
                                    stats.utilization,
                                );

                                return (
                                    <tr
                                        key={member.id}
                                        className="cursor-pointer"
                                        onClick={() =>
                                            setSelectedMember(member)
                                        }
                                    >
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                                                        {initials(member.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-2 font-medium">
                                                        {member.name}
                                                        {member.isOwner && (
                                                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {member.email ??
                                                            'Bez e-mailu'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="min-w-48">
                                            <div className="flex items-center gap-3">
                                                <div className="progress flex-1">
                                                    <div
                                                        className={`progress__fill ${
                                                            stats.utilization >
                                                            100
                                                                ? 'progress__fill--danger'
                                                                : stats.utilization >
                                                                    85
                                                                  ? 'progress__fill--warning'
                                                                  : ''
                                                        }`}
                                                        style={{
                                                            width: `${utilization}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="mono min-w-10 text-right text-xs">
                                                    {stats.utilization}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="mono">
                                            {stats.assignedTasks}
                                        </td>
                                        <td className="mono">
                                            {formatHours(stats.weeklyLoad)}h{' '}
                                            <span className="text-muted-foreground">
                                                /{' '}
                                                {formatHours(
                                                    stats.weeklyCapacity,
                                                )}
                                                h
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-1">
                                                {can('manage_team') &&
                                                    !member.isOwner && (
                                                        <>
                                                            <div
                                                                onClick={(
                                                                    event,
                                                                ) =>
                                                                    event.stopPropagation()
                                                                }
                                                            >
                                                                <EditTeamMemberDialog
                                                                    project={
                                                                        project
                                                                    }
                                                                    member={
                                                                        member
                                                                    }
                                                                />
                                                            </div>
                                                            <div
                                                                onClick={(
                                                                    event,
                                                                ) =>
                                                                    event.stopPropagation()
                                                                }
                                                            >
                                                                <RemoveTeamMemberDialog
                                                                    project={
                                                                        project
                                                                    }
                                                                    member={
                                                                        member
                                                                    }
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <Dialog
                open={selectedMember !== null}
                onOpenChange={(open) => {
                    if (!open) setSelectedMember(null);
                }}
            >
                {selectedMember && selectedStats && (
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <div className="flex items-start gap-4 pr-8">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                                        {initials(selectedMember.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="flex items-center gap-2">
                                        {selectedMember.name}
                                        {selectedMember.isOwner && (
                                            <Crown className="h-4 w-4 text-amber-500" />
                                        )}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {selectedMember.email ?? 'Bez e-mailu'}{' '}
                                        ·{' '}
                                        {selectedMember.isOwner
                                            ? 'Vedúci projektu'
                                            : 'Člen tímu'}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <MemberMetric
                                icon={<BriefcaseBusiness className="h-4 w-4" />}
                                label="Pridelené úlohy"
                                value={selectedStats.assignedTasks.toString()}
                            />
                            <MemberMetric
                                icon={<Clock3 className="h-4 w-4" />}
                                label="Hodiny tento týždeň"
                                value={`${formatHours(
                                    selectedStats.weeklyLoad,
                                )}h / ${formatHours(
                                    selectedStats.weeklyCapacity,
                                )}h`}
                            />
                            <MemberMetric
                                icon={<UserRound className="h-4 w-4" />}
                                label="Alokácia v projekte"
                                value={`${selectedStats.allocation}%`}
                            />
                            <MemberMetric
                                icon={<ShieldCheck className="h-4 w-4" />}
                                label="Vyťaženie"
                                value={`${selectedStats.utilization}%`}
                            />
                        </div>

                        <div>
                            <h4 className="mb-3 text-sm font-semibold">
                                Projektové oprávnenia
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {PERMISSION_GROUPS.map((group) => {
                                    const granted = group.permissions.filter(
                                        (permission) =>
                                            selectedMember.permissions.includes(
                                                permission.value,
                                            ),
                                    );

                                    if (granted.length === 0) return null;

                                    return (
                                        <div
                                            key={group.label}
                                            className="rounded-lg border border-border bg-card"
                                        >
                                            <div className="border-b border-border px-3 py-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                {group.label}
                                            </div>
                                            <div className="divide-y divide-border">
                                                {granted.map((permission) => (
                                                    <div
                                                        key={permission.value}
                                                        className="flex items-center gap-2 px-3 py-2 text-sm"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                        <span>
                                                            {PERMISSION_LABELS[
                                                                permission.value
                                                            ] ??
                                                                permission.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </>
    );
};

const MemberMetric = ({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: string;
}) => (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {icon}
            {label}
        </div>
        <div className="text-lg font-semibold">{value}</div>
    </div>
);
