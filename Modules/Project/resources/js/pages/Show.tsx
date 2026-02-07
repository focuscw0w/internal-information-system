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
    console.log(project);

    const budgetSpent = project.budget_spent ?? 0;
    const budget = project.budget ?? 0;

    const budgetPercentage = budget > 0 ? (budgetSpent / budget) * 100 : 0;
    const capacityPercentage =
        project.capacity_available > 0
            ? (project.capacity_used / project.capacity_available) * 100
            : 0;
    const remainingBudget = budget - budgetSpent;

    const getStatusColor = (status: string) => {
        const colors = {
            backlog: 'bg-gray-500',
            active: 'bg-blue-500',
            paused: 'bg-yellow-500',
            completed: 'bg-green-500',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-500';
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            backlog: 'Backlog',
            active: 'Aktívny',
            paused: 'Pozastavený',
            completed: 'Dokončený',
        };
        return labels[status as keyof typeof labels] || status;
    };

    const getWorkloadColor = (workload: string) => {
        const colors = {
            low: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            overloaded: 'bg-red-100 text-red-800',
        };
        return colors[workload as keyof typeof colors];
    };

    const getWorkloadLabel = (workload: string) => {
        const labels = {
            low: 'Nízke zaťaženie',
            medium: 'Stredné zaťaženie',
            high: 'Vysoké zaťaženie',
            overloaded: 'Preťažené',
        };
        return labels[workload as keyof typeof labels];
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            low: 'text-green-600 bg-green-50',
            medium: 'text-yellow-600 bg-yellow-50',
            high: 'text-red-600 bg-red-50',
        };
        return colors[priority as keyof typeof colors];
    };

    const getTaskStatusIcon = (status: string) => {
        switch (status) {
            case 'done':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'in_progress':
                return <PlayCircle className="h-4 w-4 text-blue-500" />;
            case 'testing':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            default:
                return <CircleDashed className="h-4 w-4 text-gray-400" />;
        }
    };

    return (
        <AppLayout>
            <Head title={`Detail projektu - ${project.name}`} />

            <div className="mx-auto max-w-7xl space-y-6 p-6">
                {/* Header */}
                <div>
                    <Link
                        href="/project"
                        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Späť na projekty
                    </Link>

                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {project.name}
                            </h1>
                            {project.owner && (
                                <p className="mt-1 text-gray-600">
                                    Owner: {project.owner.name}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Badge className={getStatusColor(project.status)}>
                                {getStatusLabel(project.status)}
                            </Badge>
                            <Badge
                                className={getWorkloadColor(project.workload)}
                            >
                                {getWorkloadLabel(project.workload)}
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.visit(`/projects/${project.id}/edit`)
                                }
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Upraviť
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-sm font-medium text-gray-600">
                                <Calendar className="mr-2 h-4 w-4" />
                                Obdobie projektu
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold">
                                {new Date(
                                    project.start_date,
                                ).toLocaleDateString('sk-SK')}
                            </p>
                            <p className="text-sm text-gray-500">
                                až{' '}
                                {new Date(project.end_date).toLocaleDateString(
                                    'sk-SK',
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-sm font-medium text-gray-600">
                                <DollarSign className="mr-2 h-4 w-4" />
                                Rozpočet
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {project.budget_spent.toFixed(2)}€
                            </p>
                            <p className="text-sm text-gray-500">
                                z {project.budget.toFixed(2)}€
                            </p>
                            <Progress
                                value={budgetPercentage}
                                className="mt-2 h-2"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-sm font-medium text-gray-600">
                                <Clock className="mr-2 h-4 w-4" />
                                Kapacita
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {project.capacity_used}h
                            </p>
                            <p className="text-sm text-gray-500">
                                z {project.capacity_available}h
                            </p>
                            <Progress
                                value={capacityPercentage}
                                className="mt-2 h-2"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-sm font-medium text-gray-600">
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Progres
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {project.progress}%
                            </p>
                            <p className="text-sm text-gray-500">
                                {project.tasks_completed} z{' '}
                                {project.tasks_total} úloh
                            </p>
                            <Progress
                                value={project.progress}
                                className="mt-2 h-2"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Description */}
                {project.description && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Popis projektu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-gray-700">
                                {project.description}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Team Allocations */}
                {project.allocations && project.allocations.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Users className="mr-2 h-5 w-5" />
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
                                            className="flex items-center justify-between rounded-lg border p-4"
                                        >
                                            <div className="flex-1">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">
                                                            {
                                                                allocation.user
                                                                    .name
                                                            }
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            {
                                                                allocation.percentage
                                                            }
                                                            % alokácia
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold">
                                                            {
                                                                allocation.used_hours
                                                            }
                                                            h /{' '}
                                                            {
                                                                allocation.allocated_hours
                                                            }
                                                            h
                                                        </p>
                                                        <p className="text-sm text-gray-500">
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
                                                    className="h-2"
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
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>
                                Úlohy ({project.tasks_completed}/
                                {project.tasks_total})
                            </CardTitle>
                            <Button
                                size="sm"
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
                            {project.tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
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
                                                        👤{' '}
                                                        {
                                                            task.assigned_user
                                                                .name
                                                        }
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
                                            className={getPriorityColor(
                                                task.priority,
                                            )}
                                        >
                                            {task.priority}
                                        </Badge>
                                        <div className="text-right text-sm text-gray-600">
                                            <div className="font-semibold">
                                                {task.actual_hours}h /{' '}
                                                {task.estimated_hours}h
                                            </div>
                                            {task.actual_hours >
                                                task.estimated_hours && (
                                                <span className="text-xs text-red-600">
                                                    Prekročené o{' '}
                                                    {task.actual_hours -
                                                        task.estimated_hours}
                                                    h
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {project.tasks.length === 0 && (
                                <div className="py-12 text-center">
                                    <CircleDashed className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                    <p className="text-gray-500">
                                        Zatiaľ nie sú vytvorené žiadne úlohy
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
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
