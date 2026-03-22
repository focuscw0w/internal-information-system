import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { FolderOpen } from 'lucide-react';

interface ProjectSummary {
    id: number;
    name: string;
    role: string;
    permissions: string[];
    tasks_assigned: number;
    tasks_completed: number;
}

interface UserProjectsCardProps {
    projects: ProjectSummary[];
}

export const UserProjectsCard = ({ projects }: UserProjectsCardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Moje projekty
                </CardTitle>
                <CardDescription>
                    Projekty, v ktorých som členom tímu.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {projects.length > 0 ? (
                    <div className="space-y-3">
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-gray-50/50"
                            >
                                <div>
                                    <p className="text-sm font-medium">
                                        {project.name}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {project.role}
                                    </p>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                    <p>
                                        {project.tasks_completed}/
                                        {project.tasks_assigned} úloh
                                        dokončených
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Nie ste členom žiadneho projektu.
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
