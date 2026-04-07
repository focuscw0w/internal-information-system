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
        <div className="mb-3">
            <div className="mb-2 flex items-center gap-2">
                <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
                {isAtRisk && (
                    <span title="Projekt je ohrozený" className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
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
