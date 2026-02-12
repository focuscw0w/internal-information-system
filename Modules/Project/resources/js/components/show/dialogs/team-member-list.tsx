import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { User } from '@/types';
import { Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { PERMISSION_GROUPS } from '../../../config';
import { TeamMemberSettings } from '../../../types/types';

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
        value: any,
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

    const togglePermission = (userId: number, permission: string) => {
        const currentPermissions = teamSettings[userId]?.permissions || [];
        const newPermissions = currentPermissions.includes(permission)
            ? currentPermissions.filter((p) => p !== permission)
            : [...currentPermissions, permission];

        handleSettingChange(userId, 'permissions', newPermissions);
    };

    return (
        <div className="space-y-4">
            {/* Add Member Section */}
            <div className="rounded-lg border bg-gray-50 p-4">
                <Label className="mb-2 block text-sm font-semibold">
                    Pridať člena
                </Label>
                <div className="flex gap-2">
                    <Select
                        value={selectedUserId}
                        onValueChange={setSelectedUserId}
                    >
                        <SelectTrigger className="flex-1 bg-white">
                            <SelectValue placeholder="Vyberte používateľa..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableUsers.length === 0 ? (
                                <div className="p-3 text-center text-sm text-gray-500">
                                    Všetci používatelia sú už priradení
                                </div>
                            ) : (
                                availableUsers.map((user) => (
                                    <SelectItem
                                        key={user.id}
                                        value={user.id.toString()}
                                    >
                                        <div>
                                            <div className="font-medium">
                                                {user.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {user.email}
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        onClick={handleAddMember}
                        disabled={
                            !selectedUserId || availableUsers.length === 0
                        }
                    >
                        <Plus size={18} className="mr-2" />
                        Pridať
                    </Button>
                </div>
            </div>

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
                            <div
                                key={userId}
                                className="rounded-lg border bg-white p-4 shadow-sm"
                            >
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
                                            <p className="text-sm text-gray-500">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleRemoveMember(userId)
                                        }
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
                                            handleSettingChange(
                                                userId,
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
                                        Oprávnenia (
                                        {settings.permissions.length} vybraných)
                                    </Label>
                                    <div className="space-y-2">
                                        {PERMISSION_GROUPS.map((group) => {
                                            const groupPermValues =
                                                group.permissions.map(
                                                    (p) => p.value,
                                                );
                                            const hasPerms =
                                                groupPermValues.filter((p) =>
                                                    settings.permissions.includes(
                                                        p,
                                                    ),
                                                );

                                            if (hasPerms.length === 0)
                                                return null;

                                            return (
                                                <div
                                                    key={group.label}
                                                    className="rounded-md bg-gray-50 p-2"
                                                >
                                                    <p className="mb-1 text-xs font-semibold text-gray-700">
                                                        {group.label}
                                                    </p>
                                                    <div className="space-y-1">
                                                        {group.permissions.map(
                                                            (perm) => (
                                                                <div
                                                                    key={
                                                                        perm.value
                                                                    }
                                                                    className="flex items-center space-x-2"
                                                                >
                                                                    <Checkbox
                                                                        id={`${userId}-${perm.value}`}
                                                                        checked={settings.permissions.includes(
                                                                            perm.value,
                                                                        )}
                                                                        onCheckedChange={() =>
                                                                            togglePermission(
                                                                                userId,
                                                                                perm.value,
                                                                            )
                                                                        }
                                                                    />
                                                                    <label
                                                                        htmlFor={`${userId}-${perm.value}`}
                                                                        className="cursor-pointer text-xs text-gray-700"
                                                                    >
                                                                        {
                                                                            perm.label
                                                                        }
                                                                    </label>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <Users className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">
                        Žiadni členovia
                    </p>
                    <p className="text-xs text-gray-500">
                        Použite formulár vyššie pre pridanie členov tímu
                    </p>
                </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};
