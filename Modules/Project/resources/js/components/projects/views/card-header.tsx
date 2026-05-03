import { AlertTriangle } from 'lucide-react';
import { ProjectStatus, WorkloadLevel } from '../../../types/types';
import { BadgeLabel } from '../../ui/badge';

interface CardHeaderProps {
    name: string;
    status: ProjectStatus;
    workload: WorkloadLevel;
    isAtRisk?: boolean;
}

export const CardHeader = ({ name, status, workload, isAtRisk }: CardHeaderProps) => {
    return (
        <div className="mb-4 pr-8">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Internal
            </div>
            <div className="mb-2 flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">{name}</h3>
                {isAtRisk && (
                    <span title="Projekt je ohrozený" className="badge badge--danger">
                        <AlertTriangle className="h-3 w-3" />
                        Ohrozený
                    </span>
                )}
            </div>
            <div className="flex gap-2">
                <BadgeLabel type="status" value={status} showLabel />
                <BadgeLabel type="workload" value={workload} showLabel />
            </div>
        </div>
    );
};
