import { AlertCircle } from 'lucide-react';
import React from 'react';
import { ProjectStatus, WorkloadLevel } from '../types/project.types';
import {
    getStatusColor,
    getStatusText,
    getWorkloadColor,
} from '../utils/project.utils';

interface ProjectHeaderProps {
    name: string;
    status: ProjectStatus;
    workload: WorkloadLevel;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
    name,
    status,
    workload,
}) => {
    return (
        <div className="mb-2">
            <div className="mb-1 flex items-center gap-4">
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
            <span
                className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(status)}`}
            >
                {getStatusText(status)}
            </span>
        </div>
    );
};
