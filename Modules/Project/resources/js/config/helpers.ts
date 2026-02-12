import { ProjectStatus, WorkloadLevel } from '../types/types';

export const getStatusColor = (status: ProjectStatus): string => {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-700';
        case 'planning':
            return 'bg-blue-100 text-blue-700';
        case 'completed':
            return 'bg-gray-100 text-gray-700';
        case 'on_hold':
            return 'bg-yellow-100 text-yellow-700';
        case 'cancelled':
            return 'bg-red-100 text-red-700';
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

/**
 * Vráti slovenský text pre status
 */
export const getStatusText = (status: ProjectStatus): string => {
    switch (status) {
        case 'active':
            return 'Aktívny';
        case 'planning':
            return 'Plánovanie';
        case 'completed':
            return 'Dokončený';
        case 'on_hold':
            return 'Pozastavený';
        case 'cancelled':
            return 'Zrušený';
        default:
            return status;
    }
};

export const getCapacityColor = (capacityUsed: number): string => {
    if (capacityUsed > 80) return 'bg-red-500';
    if (capacityUsed > 60) return 'bg-yellow-500';
    return 'bg-green-500';
};

export const getAllocationColor = (allocation: number): string => {
    if (allocation > 100) return 'text-red-600';
    if (allocation > 80) return 'text-orange-600';
    return 'text-green-600';
};
