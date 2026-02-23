import { ProjectStatus, WorkloadLevel } from '../../../types/types';
import { BadgeLabel } from '../../ui/badge';

interface CardHeaderProps {
    name: string;
    status: ProjectStatus;
    workload: WorkloadLevel;
}

export const CardHeader = ({ name, status, workload }: CardHeaderProps) => {
    return (
        <div className="mb-3">
            <div className="mb-2 flex items-center gap-4">
                <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
            </div>
            <div className="flex gap-2">
                <BadgeLabel type="status" value={status} showLabel />
                <BadgeLabel type="workload" value={workload} showLabel />
            </div>
        </div>
    );
};
