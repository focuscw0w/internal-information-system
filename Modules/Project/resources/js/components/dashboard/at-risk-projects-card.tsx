import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { AlertTriangle, FolderKanban } from 'lucide-react';

export interface DashboardProject {
    id: number;
    name: string;
    status: string;
    progress: number;
    end_date: string | null;
    is_overdue: boolean;
    days_remaining: number;
    at_risk_tasks_count: number;
    owner: {
        id: number | null;
        name: string;
    };
}

interface AtRiskProjectsCardProps {
    projects: DashboardProject[];
}

export const AtRiskProjectsCard = ({ projects }: AtRiskProjectsCardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Projekty at risk
                </CardTitle>
                <CardDescription>
                    Aktívne projekty, ktoré meškajú alebo majú rizikové
                    otvorené úlohy.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
                        <FolderKanban className="h-8 w-8 text-gray-300" />
                        <p className="mt-3 text-sm font-medium text-gray-900">
                            Žiadne rizikové projekty
                        </p>
                        <p className="mt-1 max-w-sm text-sm text-gray-500">
                            Tvoje projekty aktuálne nevyzerajú rizikovo.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-gray-900">
                                            {project.name}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Owner: {project.owner.name}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            project.is_overdue
                                                ? 'destructive'
                                                : 'secondary'
                                        }
                                    >
                                        {project.is_overdue
                                            ? 'Po termíne'
                                            : `${project.days_remaining} dní`}
                                    </Badge>
                                </div>
                                <div className="mt-4 h-2 rounded-full bg-gray-100">
                                    <div
                                        className="h-2 rounded-full bg-amber-500"
                                        style={{
                                            width: `${project.progress}%`,
                                        }}
                                    />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                    <span>{project.progress}% hotovo</span>
                                    <span>
                                        {project.at_risk_tasks_count} rizikových
                                        úloh
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
