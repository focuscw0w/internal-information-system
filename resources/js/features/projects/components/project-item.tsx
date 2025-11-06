import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import EditProjectModal from '@/features/projects/components/edit-project-modal';
import RemoveProjectModal from '@/features/projects/components/remove-project-modal';
import { Link } from '@inertiajs/react';

interface ProjectItemProps {
    id: number;
}

export default function ProjectItem({ id }: ProjectItemProps) {
    return (
        <Card className="relative flex w-full cursor-pointer items-center justify-between rounded-xl border bg-background px-4 py-3 transition hover:bg-muted/40">
            <Link
                href={`/projects/${id}`}
                className="absolute inset-0 z-10"
                aria-label="Open project"
            />

            <div className="flex flex-col gap-1">
                <h3 className="text-base leading-none font-medium">
                    Názov projektu
                </h3>
                <p className="text-sm text-muted-foreground">
                    Klient: ACME s.r.o.
                </p>
            </div>

            <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-xs">
                    active
                </Badge>

                <div className="text-sm text-muted-foreground">
                    12.01.2025 → 30.03.2025
                </div>

                <div className="z-20 flex items-center gap-2">
                    <EditProjectModal />

                    <RemoveProjectModal />
                </div>
            </div>
        </Card>
    );
}
