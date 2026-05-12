import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    FileText,
    GanttChartSquare,
    KanbanIcon,
    Plus,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Kanban } from '../components/project-detail/kanban/kanban';
import { GanttChart } from '../components/project-detail/tab-views/gantt';
import { ProjectOverview } from '../components/project-detail/tab-views/project-overview';
import { Team } from '../components/project-detail/tab-views/team';
import { Timeline } from '../components/project-detail/tab-views/timeline';
import { CreateTaskDialog } from '../components/project-detail/task-table/dialogs/create-task';
import { TaskTable } from '../components/project-detail/task-table/task-table';
import { EditProjectDialog } from '../components/projects/dialogs/edit-project';
import { BadgeLabel } from '../components/ui/badge';
import ProjectLayout from '../layouts/project-layout';
import { Project } from '../types/types';

type TeamCapacitySnapshot = Record<
    number,
    {
        weekly_capacity_hours: number;
        weekly_load_hours: number;
        weekly_utilization: number;
        free_capacity_hours: number;
        is_over_capacity: boolean;
    }
>;

export default function Show({
    project,
    team_capacity,
}: {
    project: Project;
    team_capacity: TeamCapacitySnapshot;
}) {
    const projectWithCapacity: Project = {
        ...project,
        team: project.team.map((member) => ({
            ...member,
            ...(team_capacity[member.id] ?? {}),
        })),
    };
    const permissions = project.current_user_permissions ?? [];
    const canCreateTasks = permissions.includes('create_tasks');
    const [createTaskOpen, setCreateTaskOpen] = useState(false);

    const can = (permission: string) => permissions.includes(permission);
    const atRiskTaskCount =
        project.tasks?.filter(
            (task) => task.is_at_risk && task.status !== 'done',
        ).length ?? 0;

    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.get('action') !== 'create-task') {
            return;
        }

        if (canCreateTasks) {
            setCreateTaskOpen(true);
        }

        url.searchParams.delete('action');
        window.history.replaceState(
            null,
            '',
            `${url.pathname}${url.search}${url.hash}`,
        );
    }, [canCreateTasks]);

    return (
        <ProjectLayout project={projectWithCapacity}>
            <Head title={`Detail projektu - ${project.name}`} />

            <div className="page min-h-screen">
                <Link href="/projects" className="page-head__back">
                    <ArrowLeft />
                    Späť na projekty
                </Link>

                <div className="page-head">
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
                                {project.owner?.name ?? 'Internal'}
                            </span>
                            <BadgeLabel type="status" value={project.status} />
                            <BadgeLabel
                                type="workload"
                                value={project.workload}
                            />
                        </div>
                        <h1 className="page-head__title">{project.name}</h1>
                        <p className="page-head__subtitle">
                            Vedúci projektu:{' '}
                            <strong className="font-semibold text-foreground">
                                {project.owner?.name ?? 'Nepriradený'}
                            </strong>{' '}
                            ·{' '}
                            {new Date(project.start_date).toLocaleDateString(
                                'sk-SK',
                            )}{' '}
                            –{' '}
                            {new Date(project.end_date).toLocaleDateString(
                                'sk-SK',
                            )}
                        </p>
                    </div>

                    <div className="page-head__actions">
                        {can('view_team') && (
                            <button type="button" className="btn">
                                <Users className="h-4 w-4" />
                                Spravovať tím
                            </button>
                        )}
                        {can('edit_project') && (
                            <EditProjectDialog
                                project={projectWithCapacity}
                                text="Upraviť projekt"
                            />
                        )}
                        {canCreateTasks && (
                            <CreateTaskDialog
                                projectId={project.id}
                                team={project.team}
                                open={createTaskOpen}
                                onOpenChange={setCreateTaskOpen}
                                trigger={
                                    <button
                                        type="button"
                                        className="btn btn--primary"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Nová úloha
                                    </button>
                                }
                            />
                        )}
                    </div>
                </div>

                <div className="kpi-grid">
                    <div className="kpi">
                        <span className="kpi__label">Pokrok</span>
                        <span className="kpi__value">
                            {project.progress}
                            <sub>%</sub>
                        </span>
                        <div className="progress mt-3">
                            <div
                                className="progress__fill"
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Vyťaženie tímu</span>
                        <span
                            className="kpi__value"
                            style={{
                                color:
                                    project.capacity_used > 100
                                        ? 'var(--danger-text)'
                                        : undefined,
                            }}
                        >
                            {project.capacity_used}
                            <sub>%</sub>
                        </span>
                        <div className="progress mt-3">
                            <div
                                className={`progress__fill ${
                                    project.capacity_used > 100
                                        ? 'progress__fill--danger'
                                        : project.capacity_used > 85
                                          ? 'progress__fill--warning'
                                          : ''
                                }`}
                                style={{
                                    width: `${Math.min(project.capacity_used, 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Úlohy</span>
                        <span className="kpi__value">
                            {project.tasks_completed}
                            <sub>/ {project.tasks_total}</sub>
                        </span>
                        <span className="kpi__delta">
                            {project.tasks_total - project.tasks_completed}{' '}
                            ostáva
                        </span>
                    </div>
                    <div className="kpi">
                        <span className="kpi__label">Do deadline</span>
                        <span className="kpi__value">
                            {Math.abs(project.days_remaining)}
                            <sub>
                                {project.days_remaining >= 0 ? 'dní' : 'dní po'}
                            </sub>
                        </span>
                        <span className="kpi__delta kpi__delta--down">
                            {atRiskTaskCount} ohrozené úlohy
                        </span>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="mb-12 w-full">
                    <div className="flex items-center justify-between">
                        <TabsList
                            variant="line"
                            className="tabbar w-full justify-start"
                        >
                            <TabsTrigger value="overview">
                                <FileText className="h-4 w-4" />
                                Prehľad
                            </TabsTrigger>
                            <TabsTrigger value="tasks">
                                <FileText className="h-4 w-4" />
                                Úlohy
                                <span className="tab__count">
                                    {project.tasks?.length ?? 0}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="kanban">
                                <KanbanIcon className="h-4 w-4" />
                                Kanban
                            </TabsTrigger>
                            <TabsTrigger value="timeline">
                                <Calendar className="h-4 w-4" />
                                Časová os
                            </TabsTrigger>
                            <TabsTrigger value="gantt">
                                <GanttChartSquare className="h-4 w-4" />
                                Gantt
                            </TabsTrigger>
                            {can('view_team') && (
                                <TabsTrigger value="team">
                                    <Users className="h-4 w-4" />
                                    Tím
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="mt-6">
                        <ProjectOverview project={projectWithCapacity} />
                    </TabsContent>
                    <TabsContent value="tasks" className="mt-6">
                        <TaskTable project={projectWithCapacity} />
                    </TabsContent>
                    <TabsContent value="kanban" className="mt-6">
                        <Kanban project={projectWithCapacity} />
                    </TabsContent>
                    <TabsContent value="timeline" className="mt-6">
                        <Timeline project={projectWithCapacity} />
                    </TabsContent>
                    <TabsContent value="gantt" className="mt-6">
                        <GanttChart project={projectWithCapacity} />
                    </TabsContent>
                    {can('view_team') && (
                        <TabsContent value="team" className="mt-6">
                            <Team project={projectWithCapacity} />
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </ProjectLayout>
    );
}
