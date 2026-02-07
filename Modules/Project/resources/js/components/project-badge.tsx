import { Badge } from '@/components/ui/badge';
import {
    ProjectStatus,
    TaskPriority,
    TaskStatus,
    WorkloadLevel,
} from '../types/project.types';

type BadgeType = 'status' | 'workload' | 'priority' | 'task-status';

interface ProjectBadgeProps {
    type: BadgeType;
    value: ProjectStatus | WorkloadLevel | TaskPriority | TaskStatus;
    variant?: 'default' | 'outline';
}

export const ProjectBadge = ({
    type,
    value,
    variant = 'outline',
}: ProjectBadgeProps) => {
    const getColor = (): string => {
        // Status farby
        if (type === 'status') {
            const colors: Record<ProjectStatus, string> = {
                planning: 'bg-blue-100 text-blue-700 border-blue-200',
                active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                paused: 'bg-amber-100 text-amber-700 border-amber-200',
                completed: 'bg-purple-100 text-purple-700 border-purple-200',
            };
            return colors[value as ProjectStatus];
        }

        // Workload farby
        if (type === 'workload') {
            const colors: Record<WorkloadLevel, string> = {
                low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                medium: 'bg-amber-100 text-amber-700 border-amber-200',
                high: 'bg-orange-100 text-orange-700 border-orange-200',
                overloaded: 'bg-red-100 text-red-700 border-red-200',
            };
            return colors[value as WorkloadLevel];
        }

        // Priority farby
        if (type === 'priority') {
            const colors: Record<TaskPriority, string> = {
                low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                medium: 'bg-amber-50 text-amber-700 border-amber-200',
                high: 'bg-red-50 text-red-700 border-red-200',
            };
            return colors[value as TaskPriority];
        }

        // Task status farby
        if (type === 'task-status') {
            const colors: Record<TaskStatus, string> = {
                todo: 'bg-gray-100 text-gray-700 border-gray-200',
                in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
                testing: 'bg-amber-100 text-amber-700 border-amber-200',
                done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            };
            return colors[value as TaskStatus];
        }

        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const getText = (): string => {
        // Status texty
        if (type === 'status') {
            const labels: Record<ProjectStatus, string> = {
                planning: 'Plánovanie',
                active: 'Aktívny',
                paused: 'Pozastavený',
                completed: 'Dokončený',
            };
            return labels[value as ProjectStatus];
        }

        // Workload texty
        if (type === 'workload') {
            const labels: Record<WorkloadLevel, string> = {
                low: 'Nízke',
                medium: 'Stredné',
                high: 'Vysoké',
                overloaded: 'Preťažené',
            };
            return labels[value as WorkloadLevel];
        }

        // Priority texty
        if (type === 'priority') {
            const labels: Record<TaskPriority, string> = {
                low: 'Nízka',
                medium: 'Stredná',
                high: 'Vysoká',
            };
            return labels[value as TaskPriority];
        }

        // Task status texty
        if (type === 'task-status') {
            const labels: Record<TaskStatus, string> = {
                todo: 'Nová',
                in_progress: 'Prebieha',
                testing: 'Testovanie',
                done: 'Hotovo',
            };
            return labels[value as TaskStatus];
        }

        return value.toString();
    };

    return (
        <Badge variant={variant} className={getColor() + ' py-2 px-3'}>
            {getText()}
        </Badge>
    );
}
