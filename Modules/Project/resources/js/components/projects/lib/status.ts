import { ProjectStatus } from '../../../types/types';

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
