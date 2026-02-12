import { AlertCircle } from 'lucide-react';
import { ProjectStatus, WorkloadLevel } from '../../../types/types';
import { getWorkloadColor } from '../../../config';
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
                <div
                    className={`flex items-center gap-1 ${getWorkloadColor(workload)}`}
                >
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium capitalize">
                        {workload}
                    </span>
                </div>
            </div>
            <BadgeLabel type="status" value={status} />
        </div>
    );
};
