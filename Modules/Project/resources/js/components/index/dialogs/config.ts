export const statusOptions = [
    { value: 'planning', label: 'Plánovanie' },
    { value: 'active', label: 'Aktívny' },
    { value: 'on_hold', label: 'Pozastavený' },
    { value: 'completed', label: 'Dokončený' },
    { value: 'cancelled', label: 'Zrušený' },
];

export const workloadOptions = [
    { value: 'low', label: 'Nízke' },
    { value: 'medium', label: 'Stredné' },
    { value: 'high', label: 'Vysoké' },
];

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
