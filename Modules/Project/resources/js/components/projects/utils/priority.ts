import { ProjectPriority } from '../../../types/types';

export const getPriorityColor = (priority: ProjectPriority): string => {
    switch (priority) {
        case 'urgent':
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
