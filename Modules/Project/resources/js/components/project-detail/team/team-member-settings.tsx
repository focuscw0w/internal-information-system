import { ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { useState } from 'react';
import { TeamMemberSettings } from '../../../types/types';
import { PERMISSION_GROUPS } from '../utils/permissions';
import { PermissionGroup } from './permission-group';

interface TeamMemberSettingsFormProps {
    userId: number;
    settings: TeamMemberSettings;
    onSettingChange: (field: keyof TeamMemberSettings, value: unknown) => void;
    onTogglePermission: (permission: string) => void;
}

export const TeamMemberSettingsForm = ({
                                           userId,
                                           settings,
                                           onSettingChange,
                                           onTogglePermission,
                                       }: TeamMemberSettingsFormProps) => {
    const [showPermissions, setShowPermissions] = useState(false);

    return (
        <div className="space-y-3">
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
                <div className="space-y-2 border-t pt-3">
                    {PERMISSION_GROUPS.map((group) => (
                        <PermissionGroup
                            key={group.label}
                            userId={userId}
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
