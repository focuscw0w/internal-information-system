import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { FileText, ListChecks } from 'lucide-react';
import { BadgeLabel } from '../components/ui/badge';
import { Header } from '../components/ui/header';
import { TaskComments } from '../components/task/task-comments';
import { TaskOverview } from '../components/task/task-overview';
import { TaskSubtasks } from '../components/task/task-subtasks';
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
                    backHref={`/projects/${project.id}`}
                    backLabel={`Späť na ${project.name}`}
                    badges={
                        <>
                            <BadgeLabel
                                type="task-status"
                                value={task.status}
                                className="hidden items-center justify-center sm:flex"
                            />
                            <BadgeLabel
                                type="priority"
                                value={task.priority}
                                className="hidden items-center justify-center sm:flex"
                            />
                        </>
                    }
                />

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <div className="flex items-center justify-between">
                        <TabsList className="grid w-full max-w-sm grid-cols-2 gap-3 bg-white">
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
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="mt-6">
                        <TaskOverview task={task} project={project} />
                    </TabsContent>
                    <TabsContent value="subtasks" className="mt-6">
                        <TaskSubtasks task={task} project={project} />
                    </TabsContent>
                </Tabs>

                {/* Comments - always visible below tabs */}
                <TaskComments task={task} />
            </div>
        </AppLayout>
    );
}
