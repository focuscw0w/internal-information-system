export interface ManagedUser {
    id: number;
    name: string;
    email: string;
    permissions: string[];
    created_at: string;
}

export interface PermissionOption {
    value: string;
    label: string;
    description: string;
}

export type AvailablePermissions = Record<string, PermissionOption[]>;