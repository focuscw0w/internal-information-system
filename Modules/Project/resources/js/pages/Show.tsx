import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Calendar, KanbanIcon, LayoutGrid } from 'lucide-react';
import { Kanban } from '../components/show/kanban';
import { Overview } from '../components/show/overview';
import { ShowHeader } from '../components/show/show-header';
import { Timeline } from '../components/show/timeline';
import { Project } from '../types/project.types';

export default function Show({ project }: { project: Project }) {
    return (
        <AppLayout>
            <Head title={`Detail projektu - ${project.name}`} />

            <div className="min-h-screen space-y-6 p-6">
                {/* Header */}
                <ShowHeader project={project} />

                {/* Tabs */}
                <Tabs defaultValue="overview" className="mb-12 w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3 gap-3 bg-white">
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
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                        <Overview project={project} />
                    </TabsContent>
                    <TabsContent value="kanban" className="mt-6">
                        <Kanban project={project} />
                    </TabsContent>
                    <TabsContent value="timeline" className="mt-6">
                        <Timeline project={project} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
