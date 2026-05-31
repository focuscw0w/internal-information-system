import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { Trash2 } from 'lucide-react';
import { TeamMemberSettings } from '../../../../types/types';
import { TeamMemberSettingsForm } from '../../team/team-member-settings';

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
    return (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white">
                        {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                            {user.name}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                            {user.email}
                        </p>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                    <Trash2 size={16} className="mr-1" />
                    Odstrániť
                </Button>
            </div>

            {/* Settings */}
            <TeamMemberSettingsForm
                userId={user.id}
                settings={settings}
                onSettingChange={onSettingChange}
                onTogglePermission={onTogglePermission}
            />
        </div>
    );
};
