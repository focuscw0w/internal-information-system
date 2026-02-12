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
import { Plus, Users, X } from 'lucide-react';
import { useState } from 'react';
import { PERMISSION_GROUPS } from '../config';
import { TeamMemberSettings } from '../types/types';

interface TeamMemberSelectProps {
    allUsers: User[];
    selectedMembers: number[];
    teamSettings: Record<number, TeamMemberSettings>;
    onChange: (
        members: number[],
        settings: Record<number, TeamMemberSettings>,
    ) => void;
    error?: string;
}

export const TeamMemberSelect = ({
    allUsers,
    selectedMembers,
    teamSettings,
    onChange,
    error,
}: TeamMemberSelectProps) => {
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
                hourly_rate: undefined,
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

    const togglePermission = (userId: number, permission: string) => {
        const currentPermissions = teamSettings[userId]?.permissions || [];
        const newPermissions = currentPermissions.includes(permission)
            ? currentPermissions.filter((p) => p !== permission)
            : [...currentPermissions, permission];

        handleSettingChange(userId, 'permissions', newPermissions);
    };

    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-2">
                Tím projektu
                {selectedMembers.length > 0 && (
                    <span className="text-sm font-normal text-gray-500">
                        ({selectedMembers.length}{' '}
                        {selectedMembers.length === 1
                            ? 'člen'
                            : selectedMembers.length < 5
                              ? 'členovia'
                              : 'členov'}
                        )
                    </span>
                )}
            </Label>

            {/* Add Member Section */}
            <div className="flex gap-2">
                <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                >
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Vybrať člena tímu..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableUsers.length === 0 ? (
                            <div className="p-2 text-center text-sm text-gray-500">
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
                    disabled={!selectedUserId || availableUsers.length === 0}
                    variant="outline"
                    size="icon"
                >
                    <Plus size={16} />
                </Button>
            </div>

            {/* Selected Members List */}
            {selectedMembers.length > 0 && (
                <div className="space-y-3 rounded-lg border p-4">
                    {selectedMembers.map((userId) => {
                        const user = allUsers.find((u) => u.id === userId);
                        if (!user) return null;

                        const settings = teamSettings[userId] || {
                            allocation: 100,
                            permissions: ['view_project', 'view_tasks'],
                        };

                        return (
                            <div key={userId} className="space-y-3 rounded-md">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {user.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {user.email}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRemoveMember(userId)
                                        }
                                        className="rounded p-1 text-red-500 transition-colors hover:bg-red-50"
                                        title="Odstrániť člena"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Allocation & Hourly Rate */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs text-gray-600">
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
                                                    parseInt(e.target.value) ||
                                                        0,
                                                )
                                            }
                                            className="mt-1"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {settings.allocation}% kapacity
                                        </p>
                                    </div>
                                </div>

                                {/* Permissions by Groups */}
                                <div>
                                    <Label className="text-xs text-gray-600">
                                        Oprávnenia (
                                        {settings.permissions.length} vybraných)
                                    </Label>
                                    <div className="mt-2 space-y-3">
                                        {PERMISSION_GROUPS.map((group) => (
                                            <div
                                                key={group.label}
                                                className="rounded-md bg-gray-50 p-3"
                                            >
                                                <p className="mb-2 text-xs font-semibold text-gray-700">
                                                    {group.label}
                                                </p>
                                                <div className="space-y-2">
                                                    {group.permissions.map(
                                                        (perm) => (
                                                            <div
                                                                key={perm.value}
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
                                                                    className="cursor-pointer text-sm text-gray-700"
                                                                >
                                                                    {perm.label}
                                                                </label>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty State */}
            {selectedMembers.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <Users className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-sm text-gray-500">
                        Žiadni členovia tímu nie sú priradení
                    </p>
                </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};
