import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/types';
import { Trash2 } from 'lucide-react';
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
    console.log(settings.permissions)
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

            {/* Permissions */}
            <div>
                <Label className="mb-2 text-xs text-gray-600">
                    Oprávnenia ({settings.permissions.length} vybraných)
                </Label>
                <div className="space-y-2">
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
            </div>
        </div>
    );
};
