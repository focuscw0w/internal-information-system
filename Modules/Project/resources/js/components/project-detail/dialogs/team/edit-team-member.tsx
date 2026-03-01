import { FormDialog } from '@/components/dialogs/form-dialog';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    Project,
    TeamMember,
    TeamMemberSettings,
} from '../../../../types/types';
import { TeamMemberSettingsForm } from '../../team/team-member-settings';
import { Edit } from 'lucide-react';

interface EditTeamMemberDialogProps {
    project: Project;
    member: TeamMember;
}

const buildTeamSettings = (
    project: Project,
    overrideId?: number,
    overrideSettings?: TeamMemberSettings,
) => {
    return project.team.reduce(
        (acc, m) => {
            acc[m.id] =
                m.id === overrideId && overrideSettings
                    ? { ...overrideSettings }
                    : {
                          allocation: m.allocation || 100,
                          permissions: Array.isArray(m.permissions)
                              ? m.permissions
                              : [],
                      };
            return acc;
        },
        {} as Record<number, TeamMemberSettings>,
    );
};

export const EditTeamMemberDialog = ({
    project,
    member,
}: EditTeamMemberDialogProps) => {
    const [open, setOpen] = useState(false);

    const currentSettings: TeamMemberSettings = {
        allocation: member.allocation || 100,
        permissions: Array.isArray(member.permissions)
            ? member.permissions
            : ['view_project'],
    };

    const { data, setData, put, processing } = useForm<{
        team_members: number[];
        team_settings: Record<number, TeamMemberSettings>;
    }>({
        team_members: project.team.map((m) => m.id),
        team_settings: buildTeamSettings(project, member.id, currentSettings),
    });

    const handleOpen = (newOpen: boolean) => {
        if (newOpen) {
            setData({
                team_members: project.team.map((m) => m.id),
                team_settings: buildTeamSettings(
                    project,
                    member.id,
                    currentSettings,
                ),
            });
        }
        setOpen(newOpen);
    };

    const settings = data.team_settings[member.id] ?? currentSettings;

    const handleSettingChange = (
        field: keyof TeamMemberSettings,
        value: unknown,
    ) => {
        setData('team_settings', {
            ...data.team_settings,
            [member.id]: {
                ...settings,
                [field]: value,
            },
        });
    };

    const handleTogglePermission = (permission: string) => {
        const current = Array.isArray(settings.permissions)
            ? settings.permissions
            : [];
        const newPermissions = current.includes(permission)
            ? current.filter((p) => p !== permission)
            : [...current, permission];

        handleSettingChange('permissions', newPermissions);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/projects/${project.id}/team`, {
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={handleOpen}
            trigger={
                <button className="flex cursor-pointer items-center justify-center gap-2 rounded-lg p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600">
                    <Edit size={25} />
                </button>
            }
            title={`Upraviť člena – ${member.name}`}
            description="Zmeňte alokáciu a oprávnenia tohto člena."
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Uložiť zmeny"
        >
            <TeamMemberSettingsForm
                userId={member.id}
                settings={settings}
                onSettingChange={handleSettingChange}
                onTogglePermission={handleTogglePermission}
            />
        </FormDialog>
    );
};
