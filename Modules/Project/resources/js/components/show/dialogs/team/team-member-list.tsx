import { Label } from '@/components/ui/label';
import { User } from '@/types';
import { useState } from 'react';
import { TeamMemberSettings } from '../../../../types/types';
import { AddMemberSection } from './add-member-section';
import { EmptyTeamState } from './empty-team-state';
import { TeamMemberCard } from './team-member-card';

interface TeamMemberListProps {
    allUsers: User[];
    selectedMembers: number[];
    teamSettings: Record<number, TeamMemberSettings>;
    onChange: (
        members: number[],
        settings: Record<number, TeamMemberSettings>,
    ) => void;
    error?: string;
}

export const TeamMemberList = ({
    allUsers,
    selectedMembers,
    teamSettings,
    onChange,
    error,
}: TeamMemberListProps) => {
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    const availableUsers = allUsers.filter(
        (user) => !selectedMembers.includes(user.id),
    );

    const handleAddMember = () => {
        if (!selectedUserId) return;

        const userId = parseInt(selectedUserId);
        const newMembers = [...selectedMembers, userId];
        const newSettings = {
            ...teamSettings,
            [userId]: {
                allocation: 100,
                permissions: ['view_project', 'view_tasks'],
            },
        };

        onChange(newMembers, newSettings);
        setSelectedUserId('');
    };

    const handleRemoveMember = (userId: number) => {
        const newMembers = selectedMembers.filter((id) => id !== userId);
        const newSettings = { ...teamSettings };
        delete newSettings[userId];
        
        onChange(newMembers, newSettings);
    };

    const handleSettingChange = (
        userId: number,
        field: keyof TeamMemberSettings,
        value: unknown,
    ) => {
        const newSettings = {
            ...teamSettings,
            [userId]: {
                ...teamSettings[userId],
                [field]: value,
            },
        };

        onChange(selectedMembers, newSettings);
    };

    const handleTogglePermission = (userId: number, permission: string) => {
        const currentPermissions = teamSettings[userId]?.permissions || [];
        const newPermissions = currentPermissions.includes(permission)
            ? currentPermissions.filter((p) => p !== permission)
            : [...currentPermissions, permission];

        handleSettingChange(userId, 'permissions', newPermissions);
    };

    return (
        <div className="space-y-4">
            {/* Add Member Section */}
            <AddMemberSection
                availableUsers={availableUsers}
                selectedUserId={selectedUserId}
                onUserSelect={setSelectedUserId}
                onAddMember={handleAddMember}
            />

            {/* Team Members List */}
            {selectedMembers.length > 0 ? (
                <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                        Členovia tímu ({selectedMembers.length})
                    </Label>
                    {selectedMembers.map((userId) => {
                        const user = allUsers.find((u) => u.id === userId);
                        if (!user) return null;

                        const settings = teamSettings[userId] || {
                            allocation: 100,
                            permissions: ['view_project', 'view_tasks'],
                        };

                        return (
                            <TeamMemberCard
                                key={userId}
                                user={user}
                                settings={settings}
                                onRemove={() => handleRemoveMember(userId)}
                                onSettingChange={(field, value) =>
                                    handleSettingChange(userId, field, value)
                                }
                                onTogglePermission={(permission) =>
                                    handleTogglePermission(userId, permission)
                                }
                            />
                        );
                    })}
                </div>
            ) : (
                <EmptyTeamState />
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};