import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import EditProjectModal from '../components/edit-project-modal';
import RemoveProjectModal from '../components/remove-project-modal';
import { Project } from '../types/Project';
import { formatDate } from '../utils/date';

interface ProjectItemProps {
    project: Project;
}

export default function ProjectItem({ project }: ProjectItemProps) {
    return (
        <Card className="relative flex w-full cursor-pointer items-center justify-between rounded-xl border bg-background px-4 py-3 transition hover:bg-muted/40">
            <Link
                href={`/projects/${project.id}`}
                className="absolute inset-0 z-10"
                aria-label="Open project"
            />

            <div className="flex flex-col items-center gap-1">
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
                    {formatDate(project.start_date)} →{' '}
                    {formatDate(project.due_date)}
                </div>

                <div className="z-20 flex items-center gap-2">
                    <EditProjectModal project={project}>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </EditProjectModal>

                    <RemoveProjectModal projectId={project.id} />
                </div>
            </div>
        </Card>
    );
}
