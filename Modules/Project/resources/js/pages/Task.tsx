import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { FileText, ListChecks, Users } from 'lucide-react';
import { Comments } from '../components/task-detail/comments';
import { Assignees } from '../components/task-detail/tab-views/assignees';
import { Subtasks } from '../components/task-detail/tab-views/subtasks';
import { TaskOverview } from '../components/task-detail/tab-views/task-overview';
import { BadgeLabel } from '../components/ui/badge';
import { Header } from '../components/ui/header';
import { Project, Task } from '../types/types';

interface TaskProps {
    task: Task;
    project: Project;
}

export default function TaskPage({ task, project }: TaskProps) {
    return (
        <AppLayout>
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
                </Header>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <div className="flex items-center justify-between">
                        <TabsList className="grid w-full max-w-sm grid-cols-3 gap-3 bg-white">
                            <TabsTrigger
                                value="overview"
                                className="flex cursor-pointer items-center gap-2 py-2.5"
                            >
                                <FileText className="h-4 w-4" />
                                Prehľad
                            </TabsTrigger>
                            <TabsTrigger
                                value="subtasks"
                                className="flex cursor-pointer items-center gap-2 py-2.5"
                            >
                                <ListChecks className="h-4 w-4" />
                                Podúlohy
                            </TabsTrigger>
                            <TabsTrigger
                                value="assignees"
                                className="flex cursor-pointer items-center gap-2 py-2.5"
                            >
                                <Users className="h-4 w-4" />
                                Priradení
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="mt-6">
                        <TaskOverview task={task} project={project} />
                    </TabsContent>
                    <TabsContent value="subtasks" className="mt-6">
                        <Subtasks task={task} projectId={project.id} />
                    </TabsContent>
                    <TabsContent value="assignees" className="mt-6">
                        <Assignees task={task} projectId={project.id} />
                    </TabsContent>
                </Tabs>

                {/* Comments */}
                <Comments task={task} />
            </div>
        </AppLayout>
    );
}
