import { ProjectPriority, ProjectStatus } from '../../../types/types';

export const statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'planning', label: 'Plánovanie' },
    { value: 'active', label: 'Aktívny' },
    { value: 'on_hold', label: 'Pozastavený' },
    { value: 'completed', label: 'Dokončený' },
    { value: 'cancelled', label: 'Zrušený' },
];

export const priorityOptions: { value: ProjectPriority; label: string }[] = [
    { value: 'low', label: 'Nízka' },
    { value: 'medium', label: 'Stredná' },
    { value: 'high', label: 'Vysoká' },
    { value: 'urgent', label: 'Urgentná' },
];
