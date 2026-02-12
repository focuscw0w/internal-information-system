import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Calendar, KanbanIcon, LayoutGrid, Users } from 'lucide-react';
import { Kanban } from '../components/show/kanban';
import { Overview } from '../components/show/overview';
import { ShowHeader } from '../components/show/show-header';
import { Team } from '../components/show/team';
import { Timeline } from '../components/show/timeline';
import { Project } from '../types/types';

export default function Show({ project }: { project: Project }) {
    console.log(project)
    return (
        <AppLayout>
            <Head title={`Detail projektu - ${project.name}`} />

            <div className="min-h-screen space-y-6 p-6">
                {/* Header */}
                <ShowHeader project={project} />

                {/* Tabs */}
                <Tabs defaultValue="overview" className="mb-12 w-full">
                    <div className="flex items-center justify-between">
                        <TabsList className="grid w-full max-w-lg grid-cols-4 gap-3 bg-white">
                            <TabsTrigger
                                value="overview"
                                className="flex cursor-pointer items-center gap-2 py-2.5"
                            >
                                <LayoutGrid className="h-4 w-4" />
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
                        <Overview project={project} />
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
