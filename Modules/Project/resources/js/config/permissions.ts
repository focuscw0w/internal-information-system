import { TeamMember } from '../types/types';

export const PERMISSION_GROUPS = [
    {
        label: 'Projekt',
        permissions: [
            { value: 'view_project', label: 'Zobrazenie projektu' },
            { value: 'edit_project', label: 'Úprava projektu' },
            { value: 'delete_project', label: 'Zmazanie projektu' },
        ],
    },
    {
        label: 'Úlohy',
        permissions: [
            { value: 'view_tasks', label: 'Zobrazenie úloh' },
            { value: 'create_tasks', label: 'Vytváranie úloh' },
            { value: 'edit_tasks', label: 'Úprava úloh' },
            { value: 'delete_tasks', label: 'Mazanie úloh' },
            { value: 'assign_tasks', label: 'Priradenie úloh' },
        ],
    },
    {
        label: 'Tím',
        permissions: [
            { value: 'view_team', label: 'Zobrazenie tímu' },
            { value: 'manage_team', label: 'Správa tímu' },
        ],
    },
    {
        label: 'Rozpočet',
        permissions: [
            { value: 'view_budget', label: 'Zobrazenie rozpočtu' },
            { value: 'edit_budget', label: 'Úprava rozpočtu' },
        ],
    },
    {
        label: 'Ostatné',
        permissions: [{ value: 'export_data', label: 'Export dát' }],
    },
];

export const PERMISSION_LABELS: Record<string, string> =
    PERMISSION_GROUPS.flatMap((group) => group.permissions).reduce<
        Record<string, string>
    >((acc, perm) => {
        acc[perm.value] = perm.label;
        return acc;
    }, {});

export const hasPermission = (
    teamMember: TeamMember,
    permission: string,
): boolean => {
    return teamMember.permissions.includes(permission);
};

export const hasAnyPermission = (
    teamMember: TeamMember,
    permissions: string[],
): boolean => {
    return permissions.some((p) => teamMember.permissions.includes(p));
};

export const hasAllPermissions = (
    teamMember: TeamMember,
    permissions: string[],
): boolean => {
    return permissions.every((p) => teamMember.permissions.includes(p));
};
