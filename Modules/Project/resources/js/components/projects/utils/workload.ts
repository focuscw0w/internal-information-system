import { WorkloadLevel } from '../../../types/types';

export const getWorkloadColor = (workload: WorkloadLevel): string => {
    switch (workload) {
        case 'overloaded':
            return 'text-red-600';
        case 'high':
            return 'text-orange-600';
        case 'medium':
            return 'text-yellow-600';
        case 'low':
            return 'text-green-600';
        default:
            return 'text-gray-600';
    }
};
