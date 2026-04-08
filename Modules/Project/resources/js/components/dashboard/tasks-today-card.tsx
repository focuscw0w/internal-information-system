import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { CalendarCheck, CheckCircle2 } from 'lucide-react';

export interface DashboardTask {
    id: number;
    project_id: number;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    is_overdue: boolean;
    project: {
        id: number | null;
        name: string;
    };
}

function formatDate(date: string | null) {
    if (!date) return 'Bez termínu';
    return new Intl.DateTimeFormat('sk-SK', {
        day: 'numeric',
        month: 'short',
    }).format(new Date(date));
}

interface TasksTodayCardProps {
    tasks: DashboardTask[];
}

export const TasksTodayCard = ({ tasks }: TasksTodayCardProps) => {
    return (
        <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                    <CardTitle className="flex items-center gap-2 mb-1">
                        <CalendarCheck className="h-4 w-4 text-blue-500" />
                        Moje úlohy dnes
                    </CardTitle>
                    <CardDescription>
                        Úlohy priradené tebe s termínom dnes alebo po termíne.
                    </CardDescription>
                </div>
                <Button variant="default" size="sm" asChild>
                    <Link href="/projects">Otvoriť projekty</Link>
                </Button>
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg py-10 text-center">
                        <CheckCircle2 className="h-8 w-8 text-gray-300" />
                        <p className="mt-3 text-sm font-medium text-gray-900">
                            Žiadne urgentné úlohy
                        </p>
                        <p className="mt-1 max-w-sm text-sm text-gray-500">
                            Na dnes nemáš priradené žiadne otvorené úlohy.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y rounded-lg border">
                        {tasks.map((task) => (
                            <Link
                                key={task.id}
                                href={`/projects/${task.project_id}/tasks/${task.id}`}
                                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-gray-50"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                        {task.title}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {task.project.name}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <Badge
                                        variant={
                                            task.is_overdue
                                                ? 'destructive'
                                                : 'secondary'
                                        }
                                    >
                                        {formatDate(task.due_date)}
                                    </Badge>
                                    <Badge variant="outline">
                                        {task.priority}
                                    </Badge>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
