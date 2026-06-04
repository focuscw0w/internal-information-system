export interface ManagedUser {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    permissions: string[];
    created_at: string;
    last_active_at: string | null;
}

export interface PermissionOption {
    value: string;
    label: string;
    description: string;
}

export type AvailablePermissions = Record<string, PermissionOption[]>;