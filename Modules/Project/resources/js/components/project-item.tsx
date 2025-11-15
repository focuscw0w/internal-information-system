import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import EditProjectModal from '../components/edit-project-modal';
import RemoveProjectModal from '../components/remove-project-modal';
import { Link } from '@inertiajs/react';
import { Project } from '../types/Project';

interface ProjectItemProps {
    project: Project
}

export default function ProjectItem({ project }: ProjectItemProps) {
    return (
        <Card className="relative flex w-full cursor-pointer items-center justify-between rounded-xl border bg-background px-4 py-3 transition hover:bg-muted/40">
            <Link
                href={`/projects/${project.id}`}
                className="absolute inset-0 z-10"
                aria-label="Open project"
            />

            <div className="flex flex-col gap-1">
                <h3 className="text-base leading-none font-medium">
                    {project.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                    Klient: {project.client}
                </p>
            </div>

            <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-xs">
                    {project.status}
                </Badge>

                <div className="text-sm text-muted-foreground">
                    {project.start_date} → {project.due_date}
                </div>

                <div className="z-20 flex items-center gap-2">
                    <EditProjectModal />

                    <RemoveProjectModal />
                </div>
            </div>
        </Card>
    );
}
