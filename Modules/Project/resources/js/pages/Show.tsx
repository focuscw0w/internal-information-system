import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    CircleDashed,
    Clock,
    DollarSign,
    Edit,
    PlayCircle,
    TrendingUp,
    Users,
} from 'lucide-react';
import { Project } from '../types/project.types';

export default function Show({ project }: { project: Project }) {
    const budgetSpent = project.budget_spent ?? 0;
    const budget = project.budget ?? 0;

    const budgetPercentage = budget > 0 ? (budgetSpent / budget) * 100 : 0;
    const capacityPercentage =
        project.capacity_available > 0
            ? (project.capacity_used / project.capacity_available) * 100
            : 0;

    const getStatusColor = (status: string) => {
        const colors = {
            planning: 'bg-blue-100 text-blue-700 border-blue-200',
            active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            paused: 'bg-amber-100 text-amber-700 border-amber-200',
            completed: 'bg-purple-100 text-purple-700 border-purple-200',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            planning: 'Plánovanie',
            active: 'Aktívny',
            paused: 'Pozastavený',
            completed: 'Dokončený',
        };
        return labels[status as keyof typeof labels] || status;
    };

    const getWorkloadColor = (workload: string) => {
        const colors = {
            low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            medium: 'bg-amber-100 text-amber-700 border-amber-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            overloaded: 'bg-red-100 text-red-700 border-red-200',
        };
        return colors[workload as keyof typeof colors];
    };

    const getWorkloadLabel = (workload: string) => {
        const labels = {
            low: 'Nízke',
            medium: 'Stredné',
            high: 'Vysoké',
            overloaded: 'Preťažené',
        };
        return labels[workload as keyof typeof labels];
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            medium: 'bg-amber-50 text-amber-700 border-amber-200',
            high: 'bg-red-50 text-red-700 border-red-200',
        };
        return colors[priority as keyof typeof colors];
    };

    const getTaskStatusIcon = (status: string) => {
        switch (status) {
            case 'done':
                return <CheckCircle className="h-5 w-5 text-emerald-500" />;
            case 'in_progress':
                return <PlayCircle className="h-5 w-5 text-blue-500" />;
            case 'testing':
                return <AlertCircle className="h-5 w-5 text-amber-500" />;
            default:
                return <CircleDashed className="h-5 w-5 text-gray-400" />;
        }
    };

    return (
        <AppLayout>
            <Head title={`Detail projektu - ${project.name}`} />

            <div className="space-y-6 p-6 min-h-screen">
                {/* Header */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <Link
                        href="/project"
                        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="mr-1 h-5 w-5" />
                        Späť na projekty
                    </Link>

                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {project.name}
                            </h1>
                            {project.description && (
                                <p className="mt-2 text-gray-600 max-w-2xl">
                                    {project.description}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0 ml-4">
                            <Badge 
                                variant="outline"
                                className={getStatusColor(project.status)}
                            >
                                {getStatusLabel(project.status)}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={getWorkloadColor(project.workload)}
                            >
                                {getWorkloadLabel(project.workload)}
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-200"
                                onClick={() =>
                                    router.visit(`/projects/${project.id}/edit`)
                                }
                            >
                                <Edit className="mr-2 h-5 w-5" />
                                Upraviť
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-sm font-medium text-gray-600">
                                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                                Obdobie projektu
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-gray-900">
                                {new Date(
                                    project.start_date,
                                ).toLocaleDateString('sk-SK')}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                až{' '}
                                {new Date(project.end_date).toLocaleDateString(
                                    'sk-SK',
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-sm font-medium text-gray-600">
                                <div className="p-2 bg-emerald-50 rounded-lg mr-3">
                                    <DollarSign className="h-5 w-5 text-emerald-600" />
                                </div>
                                Rozpočet
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-gray-900">
                                {budgetSpent.toFixed(2)}€
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                z {budget.toFixed(2)}€
                            </p>
                            <Progress
                                value={budgetPercentage}
                                className="mt-3 h-2 bg-gray-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {budgetPercentage.toFixed(0)}% vyčerpané
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-sm font-medium text-gray-600">
                                <div className="p-2 bg-amber-50 rounded-lg mr-3">
                                    <Clock className="h-5 w-5 text-amber-600" />
                                </div>
                                Kapacita
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-gray-900">
                                {project.capacity_used}h
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                z {project.capacity_available}h
                            </p>
                            <Progress
                                value={capacityPercentage}
                                className="mt-3 h-2 bg-gray-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {capacityPercentage.toFixed(0)}% použité
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-sm font-medium text-gray-600">
                                <div className="p-2 bg-purple-50 rounded-lg mr-3">
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                </div>
                                Progres
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-gray-900">
                                {project.progress}%
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {project.tasks_completed} z{' '}
                                {project.tasks_total} úloh
                            </p>
                            <Progress
                                value={project.progress}
                                className="mt-3 h-2 bg-gray-100"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Team Allocations */}
                {project.allocations && project.allocations.length > 0 && (
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <Users className="mr-2 h-5 w-5 text-gray-700" />
                                Tím ({project.allocations.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {project.allocations.map((allocation) => {
                                    const allocationProgress =
                                        allocation.allocated_hours > 0
                                            ? (allocation.used_hours /
                                                  allocation.allocated_hours) *
                                              100
                                            : 0;

                                    return (
                                        <div
                                            key={allocation.id}
                                            className="flex items-center justify-between rounded-lg border border-gray-100 p-4 bg-gray-50/50"
                                        >
                                            <div className="flex-1">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">
                                                            {allocation.user.name}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            {allocation.percentage}% alokácia
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-gray-900">
                                                            {allocation.used_hours}h / {allocation.allocated_hours}h
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(
                                                                allocation.start_date,
                                                            ).toLocaleDateString(
                                                                'sk-SK',
                                                            )}{' '}
                                                            -{' '}
                                                            {new Date(
                                                                allocation.end_date,
                                                            ).toLocaleDateString(
                                                                'sk-SK',
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Progress
                                                    value={allocationProgress}
                                                    className="h-2 bg-gray-200"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tasks List */}
                <Card className="bg-white border-gray-100 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                                Úlohy ({project.tasks_completed}/{project.tasks_total})
                            </CardTitle>
                            <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90"
                                onClick={() =>
                                    router.visit(
                                        `/projects/${project.id}/tasks/create`,
                                    )
                                }
                            >
                                Pridať úlohu
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {project.tasks && project.tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm bg-gray-50/30"
                                    onClick={() =>
                                        router.visit(`/tasks/${task.id}`)
                                    }
                                >
                                    <div className="flex flex-1 items-center gap-3">
                                        {getTaskStatusIcon(task.status)}
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">
                                                {task.title}
                                            </h4>
                                            <div className="mt-1 flex items-center gap-3">
                                                {task.assigned_user && (
                                                    <span className="text-sm text-gray-500">
                                                        👤 {task.assigned_user.name}
                                                    </span>
                                                )}
                                                {task.due_date && (
                                                    <span className="text-sm text-gray-500">
                                                        📅{' '}
                                                        {new Date(
                                                            task.due_date,
                                                        ).toLocaleDateString(
                                                            'sk-SK',
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Badge
                                            variant="outline"
                                            className={getPriorityColor(task.priority)}
                                        >
                                            {task.priority}
                                        </Badge>
                                        <div className="text-right text-sm">
                                            <div className="font-semibold text-gray-900">
                                                {task.actual_hours}h / {task.estimated_hours}h
                                            </div>
                                            {task.actual_hours > task.estimated_hours && (
                                                <span className="text-xs text-red-600">
                                                    +{task.actual_hours - task.estimated_hours}h
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {(!project.tasks || project.tasks.length === 0) && (
                                <div className="py-12 text-center">
                                    <CircleDashed className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                    <p className="text-gray-500 mb-4">
                                        Zatiaľ nie sú vytvorené žiadne úlohy
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            router.visit(
                                                `/projects/${project.id}/tasks/create`,
                                            )
                                        }
                                    >
                                        Vytvoriť prvú úlohu
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}