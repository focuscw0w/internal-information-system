import { Badge } from '@/components/ui/badge';
import { getColor, getText, getTextColor } from '../../utils/badge';
import {
    ProjectStatus,
    TaskPriority,
    TaskStatus,
    WorkloadLevel,
} from '../../types/types';

type BadgeType = 'status' | 'workload' | 'priority' | 'task-status';

interface BadgeProps {
    type: BadgeType;
    value: ProjectStatus | WorkloadLevel | TaskPriority | TaskStatus;
    showLabel?: boolean;
    textOnly?: boolean;
    className?: string;
    variant?: 'default' | 'outline';
}

const TYPE_LABELS: Record<BadgeType, string> = {
    status: 'Stav',
    workload: 'Zaťaženie',
    priority: 'Priorita',
    'task-status': 'Stav',
};

export const BadgeLabel = ({
    type,
    value,
    showLabel = false,
    textOnly = false,
    className,
    variant = 'outline',
}: BadgeProps) => {
    if (textOnly) {
        return (
            <span
                className={
                    'inline-flex items-center gap-1.5 text-sm font-medium ' +
                    getTextColor(type, value) +
                    ' ' +
                    (className ?? '')
                }
            >
                {showLabel && (
                    <span className="font-normal text-gray-500">
                        {TYPE_LABELS[type]}:
                    </span>
                )}
                {getText(type, value)}
            </span>
        );
    }

    return (
        <Badge
            variant={variant}
            className={
                getColor(type, value) +
                ' flex items-center justify-center gap-1.5 px-3.5 py-2.5' +
                (className ?? '')
            }
        >
            {showLabel && (
                <span className="font-normal">{TYPE_LABELS[type]}:</span>
            )}
            {getText(type, value)}
        </Badge>
    );
};
