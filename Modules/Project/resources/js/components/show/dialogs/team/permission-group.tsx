import { Checkbox } from '@/components/ui/checkbox';

interface Permission {
    value: string;
    label: string;
}

interface PermissionGroupProps {
    userId: number;
    groupLabel: string;
    permissions: Permission[];
    selectedPermissions: string[];
    onToggle: (permission: string) => void;
}

export const PermissionGroup = ({
    userId,
    groupLabel,
    permissions,
    selectedPermissions,
    onToggle,
}: PermissionGroupProps) => {
    return (
        <div className="rounded-md bg-gray-50 p-2">
            <p className="mb-1 text-xs font-semibold text-gray-700">
                {groupLabel}
            </p>
            <div className="space-y-1">
                {permissions.map((perm) => (
                    <div
                        key={perm.value}
                        className="flex items-center space-x-2"
                    >
                        <Checkbox
                            id={`${userId}-${perm.value}`}
                            checked={selectedPermissions.includes(perm.value)}
                            onCheckedChange={() => onToggle(perm.value)}
                        />
                        <label
                            htmlFor={`${userId}-${perm.value}`}
                            className="cursor-pointer text-xs text-gray-700"
                        >
                            {perm.label}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};
