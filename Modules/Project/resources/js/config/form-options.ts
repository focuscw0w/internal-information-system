import { ProjectStatus, WorkloadLevel } from '../types/types';

export const statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'planning', label: 'Plánovanie' },
    { value: 'active', label: 'Aktívny' },
    { value: 'on_hold', label: 'Pozastavený' },
    { value: 'completed', label: 'Dokončený' },
    { value: 'cancelled', label: 'Zrušený' },
];

export const workloadOptions: { value: WorkloadLevel; label: string }[] = [
    { value: 'low', label: 'Nízke' },
    { value: 'medium', label: 'Stredné' },
    { value: 'high', label: 'Vysoké' },
];
