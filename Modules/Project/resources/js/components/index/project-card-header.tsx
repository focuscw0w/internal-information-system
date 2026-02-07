import { AlertCircle } from 'lucide-react';
import { ProjectStatus, WorkloadLevel } from '../../types/project.types';
import {
    getWorkloadColor,
} from '../../utils/project.utils';
import { ProjectBadge } from '../project-badge';

interface ProjectCardHeaderProps {
    name: string;
    status: ProjectStatus;
    workload: WorkloadLevel;
}

export const ProjectCardHeader = ({
    name,
    status,
    workload,
}: ProjectCardHeaderProps) => {
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
          <ProjectBadge type='status' value={status} />
        </div>
    );
};
