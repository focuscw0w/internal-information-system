import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Calendar, FileText, KanbanIcon, Users } from 'lucide-react';
import { Kanban } from '../components/project-detail/kanban/kanban';
import { ProjectOverview } from '../components/project-detail/tab-views/project-overview';
import { Header } from '../components/ui/header';
import { BadgeLabel } from '../components/ui/badge';
import { EditProjectDialog } from '../components/projects/dialogs/edit-project';
import { Team } from '../components/project-detail/tab-views/team';
import { Timeline } from '../components/project-detail/tab-views/timeline';
import { Project } from '../types/types';

export default function Show({ project }: { project: Project }) {
    return (
        <AppLayout>
            <Head title={`Detail projektu - ${project.name}`} />

            <div className="min-h-screen space-y-6 p-6">
                {/* Header */}
                <Header
                    title={project.name}
                    description={project.description}
                    backHref="/projects"
                    backLabel="Späť na projekty"
                >
                    <Header.Badges>
                        <BadgeLabel
                            type="status"
                            value={project.status}
                            label="Stav"
                        />
                        <BadgeLabel
                            type="workload"
                            value={project.workload}
                            label="Vyťaženie"
                        />
                    </Header.Badges>
                    <Header.Actions>
                        <EditProjectDialog
                            project={project}
                            text="Upraviť projekt"
                        />
                    </Header.Actions>
                </Header>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="mb-12 w-full">
                    <div className="flex items-center justify-between">
                        <TabsList className="grid w-full max-w-lg grid-cols-4 gap-3 bg-white">
                            <TabsTrigger
                                value="overview"
                                className="flex cursor-pointer items-center gap-2 py-2.5"
                            >
                                <FileText className="h-4 w-4" />
                                Prehľad
                            </TabsTrigger>
                            <TabsTrigger
                                value="kanban"
                                className="flex cursor-pointer items-center gap-2 py-2.5"
                            >
                                <KanbanIcon className="h-4 w-4" />
                                Kanban
                            </TabsTrigger>
                            <TabsTrigger
                                value="timeline"
                                className="flex cursor-pointer items-center gap-2 py-2.5"
                            >
                                <Calendar className="h-4 w-4" />
                                Časová os
                            </TabsTrigger>
                            <TabsTrigger
                                value="team"
                                className="flex cursor-pointer items-center gap-2 py-2.5"
                            >
                                <Users className="h-4 w-4" />
                                Tím
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="mt-6">
                        <ProjectOverview project={project} />
                    </TabsContent>
                    <TabsContent value="kanban" className="mt-6">
                        <Kanban project={project} />
                    </TabsContent>
                    <TabsContent value="timeline" className="mt-6">
                        <Timeline project={project} />
                    </TabsContent>
                    <TabsContent value="team" className="mt-6">
                        <Team project={project} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
