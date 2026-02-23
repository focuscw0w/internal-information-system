import {
    ProjectStatus,
    TaskPriority,
    TaskStatus,
    WorkloadLevel,
} from '../types/types';

type BadgeType = 'status' | 'workload' | 'priority' | 'task-status';
type BadgeValue = ProjectStatus | WorkloadLevel | TaskPriority | TaskStatus;

interface BadgeConfig {
    bg: string;
    text: string;
    label: string;
}

const CONFIG: Record<BadgeType, Record<string, BadgeConfig>> = {
    status: {
        planning: { bg: 'bg-blue-100 text-blue-700 border-blue-200', text: 'text-blue-700', label: 'Plánovanie' },
        active: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'Aktívny' },
        on_hold: { bg: 'bg-amber-100 text-amber-700 border-amber-200', text: 'text-amber-700', label: 'Pozastavený' },
        completed: { bg: 'bg-purple-100 text-purple-700 border-purple-200', text: 'text-purple-700', label: 'Dokončený' },
        cancelled: { bg: 'bg-red-100 text-red-700 border-red-200', text: 'text-red-700', label: 'Zrušený' },
    },
    workload: {
        low: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'Nízke' },
        medium: { bg: 'bg-amber-100 text-amber-700 border-amber-200', text: 'text-amber-700', label: 'Stredné' },
        high: { bg: 'bg-orange-100 text-orange-700 border-orange-200', text: 'text-orange-700', label: 'Vysoké' },
        overloaded: { bg: 'bg-red-100 text-red-700 border-red-200', text: 'text-red-700', label: 'Preťažené' },
    },
    priority: {
        low: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'Nízka' },
        medium: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', label: 'Stredná' },
        high: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700', label: 'Vysoká' },
    },
    'task-status': {
        todo: { bg: 'bg-gray-100 text-gray-700 border-gray-200', text: 'text-gray-700', label: 'Nový' },
        in_progress: { bg: 'bg-blue-100 text-blue-700 border-blue-200', text: 'text-blue-700', label: 'Prebieha' },
        testing: { bg: 'bg-amber-100 text-amber-700 border-amber-200', text: 'text-amber-700', label: 'Testovanie' },
        done: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'Hotovo' },
    },
};

const FALLBACK: BadgeConfig = {
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    text: 'text-gray-700',
    label: '',
};

const getConfig = (type: BadgeType, value: BadgeValue): BadgeConfig => {
    return CONFIG[type]?.[value] ?? FALLBACK;
};

export const getColor = (type: BadgeType, value: BadgeValue): string => {
    return getConfig(type, value).bg;
};

export const getTextColor = (type: BadgeType, value: BadgeValue): string => {
    return getConfig(type, value).text;
};

export const getText = (type: BadgeType, value: BadgeValue): string => {
    return getConfig(type, value).label || value.toString();
};
