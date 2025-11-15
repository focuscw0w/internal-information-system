import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import type { Project } from '../types/Project';
import { formatDate } from '../utils/date';

interface ProjectProps {
    project: Project;
}

export default function Project({ project }: ProjectProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Project',
            href: '/projects/' + project.id,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.name} />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Heading title={'Project page'} description={'test'} />
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline">Back</Button>
                        <Button variant="outline">Edit</Button>
                        <Button variant="destructive">Delete</Button>
                    </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Overview */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>{project.name}</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {project.description}
                            </p>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <Card className="border border-border shadow-none">
                                    <CardContent className="space-y-1 p-3">
                                        <div className="text-xs text-muted-foreground">
                                            Created
                                        </div>
                                        <div className="text-sm font-medium">
                                            {formatDate(project.start_date)}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-border shadow-none">
                                    <CardContent className="space-y-1 p-3">
                                        <div className="text-xs text-muted-foreground">
                                            Planned completion
                                        </div>
                                        <div className="text-sm font-medium">
                                            {formatDate(project.due_date)}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-border shadow-none">
                                    <CardContent className="space-y-1 p-3">
                                        <div className="text-xs text-muted-foreground">
                                            Status
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="w-fit capitalize"
                                        >
                                            {project.status}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full">
                                View Tasks
                            </Button>
                            <Button variant="outline" className="w-full">
                                View Reports
                            </Button>
                            <Button variant="outline" className="w-full">
                                Manage Team
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
