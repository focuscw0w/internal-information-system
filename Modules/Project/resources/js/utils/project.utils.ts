import { ProjectStatus, WorkloadLevel } from '../types/project.types';

export const getStatusColor = (status: ProjectStatus): string => {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-700';
        case 'planning':
            return 'bg-blue-100 text-blue-700';
        case 'completed':
            return 'bg-gray-100 text-gray-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

export const getWorkloadColor = (workload: WorkloadLevel): string => {
    switch (workload) {
        case 'high':
            return 'text-red-600';
        case 'medium':
            return 'text-yellow-600';
        case 'low':
            return 'text-green-600';
        default:
            return 'text-gray-600';
    }
};

export const getStatusText = (status: ProjectStatus): string => {
    switch (status) {
        case 'active':
            return 'Aktívny';
        case 'planning':
            return 'Plánovanie';
        case 'completed':
            return 'Dokončený';
        default:
            return status;
    }
};

export const getCapacityColor = (capacityUsed: number): string => {
    if (capacityUsed > 80) return 'bg-red-500';
    if (capacityUsed > 60) return 'bg-yellow-500';
    return 'bg-green-500';
};
