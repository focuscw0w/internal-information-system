import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';
import { Project, Task } from '../types/types';

interface ProjectLayoutProps extends PropsWithChildren {
    project?: Pick<Project, 'id' | 'name'>;
    task?: Pick<Task, 'id' | 'title'>;
}

function buildBreadcrumbs({
    project,
    task,
}: Omit<ProjectLayoutProps, 'children'>): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projekty', href: '/projects' },
    ];

    if (project) {
        breadcrumbs.push({
            title: project.name,
            href: `/projects/${project.id}`,
        });
    }

    if (project && task) {
        breadcrumbs.push({
            title: task.title,
            href: `/projects/${project.id}/tasks/${task.id}`,
        });
    }

    return breadcrumbs;
}

export default function ProjectLayout({
    children,
    project,
    task,
}: ProjectLayoutProps) {
    return (
        <AppLayout breadcrumbs={buildBreadcrumbs({ project, task })}>
            {children}
        </AppLayout>
    );
}
