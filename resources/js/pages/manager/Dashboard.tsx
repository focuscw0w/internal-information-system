import { AtRiskProjectsCard, type ManagerProject } from '@/components/manager/AtRiskProjectsCard';
import { OverdueTasksCard, type ManagerTask } from '@/components/manager/OverdueTasksCard';
import { PendingApprovalsCard, type PendingApprovalsWidget } from '@/components/manager/PendingApprovalsCard';
import { TeamHoursThisWeekCard, type TeamHoursWidget } from '@/components/manager/TeamHoursThisWeekCard';
import { TeamUtilizationCard, type TeamUtilizationWidget } from '@/components/manager/TeamUtilizationCard';
import ManagerLayout from '@/layouts/ManagerLayout';
import { SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

type Widgets = {
    teamUtilization?: TeamUtilizationWidget;
    pendingApprovals?: PendingApprovalsWidget;
    overdueTasks?: ManagerTask[];
    atRiskProjects?: ManagerProject[];
    teamHoursThisWeek?: TeamHoursWidget;
};

type DashboardProps = {
    widgets: Widgets;
};

const has = (permissions: string[], permission: string, isAdmin: boolean) =>
    isAdmin || permissions.includes(permission);

export default function Dashboard({ widgets }: DashboardProps) {
    const { props } = usePage<SharedData>();
    const permissions = (props.current_user_permissions as string[] | undefined) ?? [];
    const isAdmin = Boolean(props.auth.user?.is_admin);

    return (
        <ManagerLayout>
            <Head title="Manager Dashboard" />
            <div className="page page-enter">
                <div className="page-head">
                    <div>
                        <h1 className="page-head__title">Manager Dashboard</h1>
                        <p className="page-head__subtitle">
                            Prehľad kapacity, schvaľovania, rizík a tímových hodín.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {widgets.teamUtilization && has(permissions, 'capacity.manage', isAdmin) && (
                        <TeamUtilizationCard data={widgets.teamUtilization} />
                    )}
                    {widgets.pendingApprovals && has(permissions, 'manage_time_entries', isAdmin) && (
                        <PendingApprovalsCard data={widgets.pendingApprovals} />
                    )}
                    {widgets.teamHoursThisWeek &&
                        has(permissions, 'manage_time_entries', isAdmin) && (
                            <TeamHoursThisWeekCard data={widgets.teamHoursThisWeek} />
                        )}
                    {widgets.overdueTasks && has(permissions, 'manage_team', isAdmin) && (
                        <OverdueTasksCard tasks={widgets.overdueTasks} />
                    )}
                    {widgets.atRiskProjects && has(permissions, 'manage_team', isAdmin) && (
                        <AtRiskProjectsCard projects={widgets.atRiskProjects} />
                    )}
                </div>
            </div>
        </ManagerLayout>
    );
}
