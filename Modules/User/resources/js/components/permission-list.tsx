import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Check, Shield } from 'lucide-react';
import { AvailablePermissions } from '../types/types';

interface PermissionListProps {
    onToggle: (permission: string) => void;
    availablePermissions: AvailablePermissions;
    selected: string[];
    error?: string;
}

export const PermissionList = ({
    onToggle,
    availablePermissions,
    selected,
    error,
}: PermissionListProps) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Oprávnenia</Label>
            </div>

            <div className="space-y-4">
                {Object.entries(availablePermissions).map(
                    ([group, permissions]) => (
                        <div key={group}>
                            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                {group}
                            </p>
                            <div className="space-y-1.5">
                                {permissions.map((perm) => {
                                    const isActive = selected.includes(
                                        perm.value,
                                    );
                                    return (
                                        <button
                                            key={perm.value}
                                            type="button"
                                            onClick={() => onToggle(perm.value)}
                                            className={`cursor-pointer flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                                                isActive
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:bg-accent'
                                            }`}
                                        >
                                            <div
                                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                                    isActive
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-border'
                                                }`}
                                            >
                                                {isActive && (
                                                    <Check className="h-3 w-3" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm leading-tight font-medium">
                                                    {perm.label}
                                                </p>
                                                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                                                    {perm.description}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ),
                )}
            </div>
            <InputError message={error} />
        </div>
    );
};
