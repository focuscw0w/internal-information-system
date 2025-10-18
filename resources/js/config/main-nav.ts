import {
    dashboard,
    pricing,
    projects,
    tasks,
    timeTracking,
    users,
} from '@/routes';
import type { NavGroup } from '@/types';
import {
    CheckSquare,
    Clock,
    DollarSign,
    FolderKanban,
    LayoutGrid,
    Users,
} from 'lucide-react';

export const moduleNavigation: NavGroup[] = [
    {
        title: 'Prehľad',
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ],
    },
    {
        title: 'Práca & Čas',
        items: [
            {
                title: 'Time Tracking',
                href: timeTracking(),
                icon: Clock,
            },
            {
                title: 'Projekty',
                href: projects(),
                icon: FolderKanban,
            },
            {
                title: 'Úlohy',
                href: tasks(),
                icon: CheckSquare,
            },
        ],
    },
    {
        title: 'Naceňovanie',
        items: [
            {
                title: 'Naceniť projekt',
                href: pricing(),
                icon: DollarSign,
            },
        ],
    },
    {
        title: 'Administrácia',
        items: [
            {
                title: 'Používatelia',
                href: users(),
                icon: Users,
            },
        ],
    },
];
