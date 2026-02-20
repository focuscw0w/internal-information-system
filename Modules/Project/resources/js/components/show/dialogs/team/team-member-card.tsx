import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/types';
import { ChevronDown, ChevronRight, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PERMISSION_GROUPS } from '../../../../config';
import { TeamMemberSettings } from '../../../../types/types';
import { PermissionGroup } from './permission-group';

interface TeamMemberCardProps {
    user: User;
    settings: TeamMemberSettings;
    onRemove: () => void;
    onSettingChange: (field: keyof TeamMemberSettings, value: unknown) => void;
    onTogglePermission: (permission: string) => void;
}

export const TeamMemberCard = ({
    user,
    settings,
    onRemove,
    onSettingChange,
    onTogglePermission,
}: TeamMemberCardProps) => {
    const [showPermissions, setShowPermissions] = useState(false);

    return (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white">
                        {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">
                            {user.name}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                    <Trash2 size={16} className="mr-1" />
                    Odstrániť
                </Button>
            </div>

            {/* Allocation */}
            <div className="mb-3">
                <Label className="mb-1 text-xs text-gray-600">
                    Alokácia (%)
                </Label>
                <Input
                    type="number"
                    min="0"
                    max="200"
                    value={settings.allocation}
                    onChange={(e) =>
                        onSettingChange(
                            'allocation',
                            parseInt(e.target.value) || 0,
                        )
                    }
                />
                <p className="mt-1 text-xs text-gray-500">
                    {settings.allocation}% kapacity
                </p>
            </div>

            {/* Permissions Toggle */}
            <button
                type="button"
                onClick={() => setShowPermissions(!showPermissions)}
                className="flex w-full items-center gap-2 rounded-md p-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            >
                {showPermissions ? (
                    <ChevronDown size={16} />
                ) : (
                    <ChevronRight size={16} />
                )}
                <Shield size={14} />
                <span>Oprávnenia</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {settings.permissions.length}
                </span>
            </button>

            {/* Permissions Content */}
            {showPermissions && (
                <div className="mt-2 space-y-2 border-t pt-3">
                    {PERMISSION_GROUPS.map((group) => (
                        <PermissionGroup
                            key={group.label}
                            userId={user.id}
                            groupLabel={group.label}
                            permissions={group.permissions}
                            selectedPermissions={settings.permissions}
                            onToggle={onTogglePermission}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
