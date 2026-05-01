import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Head } from '@inertiajs/react';
import { FileText, ListChecks, Users } from 'lucide-react';
import { BlockedTaskDialog } from '../components/project-detail/blocked-task-dialog';
import { EditTaskDialog } from '../components/project-detail/task-table/dialogs/edit-task';
import { Comments } from '../components/task-detail/comments';
import { Dependencies } from '../components/task-detail/dependencies';
import { Assignees } from '../components/task-detail/tab-views/assignees';
import { Subtasks } from '../components/task-detail/tab-views/subtasks';
import { TaskOverview } from '../components/task-detail/tab-views/task-overview';
import ProjectLayout from '../layouts/project-layout';
import { BadgeLabel } from '../components/ui/badge';
import { Header } from '../components/ui/header';
import { Project, Task } from '../types/types';

type TeamCapacitySnapshot = Record<number, {
    weekly_capacity_hours: number;
    weekly_load_hours: number;
    weekly_utilization: number;
    free_capacity_hours: number;
    is_over_capacity: boolean;
}>;

interface TaskProps {
    task: Task;
    project: Project;
    team_capacity: TeamCapacitySnapshot;
}

export default function TaskPage({ task, project, team_capacity }: TaskProps) {
    const projectWithCapacity: Project = {
        ...project,
        team: project.team.map((member) => ({
            ...member,
            ...(team_capacity[member.id] ?? {}),
        })),
    };
    const permissions = project.current_user_permissions ?? [];

    const can = (permission: string) => permissions.includes(permission);

    const tabCount = 1 + (can('edit_tasks') ? 1 : 0) + (can('assign_tasks') ? 1 : 0);

    return (
        <ProjectLayout project={projectWithCapacity} task={task}>
            <Head title={`${task.title} - ${project.name}`} />

            <div className="min-h-screen space-y-6 p-6">
                <Header
                    title={task.title}
                    description={task.description}
                    backHref={`/projects/${project.id}`}
                    backLabel={`Späť na ${project.name}`}
                >
                    <Header.Badges>
                        <BadgeLabel
                            type="task-status"
                            value={task.status}
                            showLabel
                        />
                        <BadgeLabel
                            type="priority"
                            value={task.priority}
                            showLabel
                        />
                    </Header.Badges>

                    {can('edit_tasks') && (
                        <Header.Actions>
                            <EditTaskDialog
                                task={task}
                                projectId={project.id}
                                team={projectWithCapacity.team}
                                text="Upraviť úlohu"
                            />
                        </Header.Actions>
                    )}
                </Header>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <div className="flex items-center justify-between">
                        <TabsList
                            className="grid w-full max-w-sm gap-3 bg-white"
                            style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}
                        >
                            <TabsTrigger
                                value="overview"
                                className="flex cursor-pointer items-center gap-2 py-2.5"
                            >
                                <FileText className="h-4 w-4" />
                                Prehľad
                            </TabsTrigger>

                            {can('edit_tasks') && (
                                <TabsTrigger
                                    value="subtasks"
                                    className="flex cursor-pointer items-center gap-2 py-2.5"
                                >
                                    <ListChecks className="h-4 w-4" />
                                    Podúlohy
                                </TabsTrigger>
                            )}

                            {can('assign_tasks') && (
                                <TabsTrigger
                                    value="assignees"
                                    className="flex cursor-pointer items-center gap-2 py-2.5"
                                >
                                    <Users className="h-4 w-4" />
                                    Priradení
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="mt-6">
                        <TaskOverview task={task} project={projectWithCapacity} />
                    </TabsContent>

                    {can('edit_tasks') && (
                        <TabsContent value="subtasks" className="mt-6">
                            <Subtasks task={task} projectId={project.id} />
                        </TabsContent>
                    )}

                    {can('assign_tasks') && (
                        <TabsContent value="assignees" className="mt-6">
                            <Assignees task={task} project={projectWithCapacity} />
                        </TabsContent>
                    )}
                </Tabs>

                {/* Dependencies */}
                <Dependencies
                    task={task}
                    project={projectWithCapacity}
                    canEdit={can('edit_tasks')}
                />

                {/* Comments */}
                <Comments task={task} />

                <BlockedTaskDialog projectId={project.id} taskId={task.id} />
            </div>
        </ProjectLayout>
    );
}
