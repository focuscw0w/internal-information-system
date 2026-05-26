import { AlertTriangle } from 'lucide-react';
import { ProjectPriority, ProjectStatus } from '../../../types/types';
import { BadgeLabel } from '../../ui/badge';

interface CardHeaderProps {
    name: string;
    eyebrow?: string;
    status: ProjectStatus;
    priority: ProjectPriority;
    isAtRisk?: boolean;
}

export const CardHeader = ({
    name,
    eyebrow = 'Internal',
    status,
    priority,
    isAtRisk,
}: CardHeaderProps) => {
    return (
        <div className="mb-4 pr-10">
            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {eyebrow}
            </div>
            <div className="mb-2 flex min-w-0 items-center gap-2">
                <h3 className="truncate text-[15px] font-semibold leading-5 text-foreground">{name}</h3>
                {isAtRisk && (
                    <span title="Projekt je ohrozený" className="badge badge--danger shrink-0">
                        <AlertTriangle className="h-3 w-3" />
                        Ohrozený
                    </span>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                <BadgeLabel type="status" value={status} />
                <BadgeLabel type="priority" value={priority} />
            </div>
        </div>
    );
};
