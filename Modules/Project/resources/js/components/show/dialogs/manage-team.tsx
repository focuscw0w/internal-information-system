import { FormDialog } from '@/components/dialogs/form-dialog';
import { useUsers } from '@/hooks/use-users';
import { useForm } from '@inertiajs/react';
import { AlertCircle, Loader2, Users } from 'lucide-react';
import { useState } from 'react';
import { Project } from '../../../types/types';
import { TeamMemberSettings } from '../../../types/types';
import { TeamMemberList } from '../dialogs/team-member-list';

interface ManageTeamDialogProps {
    project: Project;
    trigger?: React.ReactNode;
}

interface TeamFormData {
    team_members: number[];
    team_settings: Record<number, TeamMemberSettings>;
}

export const ManageTeamDialog = ({ project, trigger }: ManageTeamDialogProps) => {
    const [open, setOpen] = useState(false);

    const { data: users = [], isLoading, isError } = useUsers();

    const initialTeamMembers = project.team.map((member) => member.id);
    const initialTeamSettings = project.team.reduce(
        (acc, member) => {
            acc[member.id] = {
                allocation: member.allocation || 100,
                permissions: member.permissions || ['view_project'],
            };
            return acc;
        },
        {} as Record<number, TeamMemberSettings>
    );

    const { data, setData, put, processing, errors } = useForm<TeamFormData>({
        team_members: initialTeamMembers,
        team_settings: initialTeamSettings,
    });

    const handleOpen = (newOpen: boolean) => {
        if (newOpen) {
            setData({
                team_members: initialTeamMembers,
                team_settings: initialTeamSettings,
            });
        }
        setOpen(newOpen);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        put(`/projects/${project.id}/team`, {
            onSuccess: () => {
                setOpen(false);
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
            },
        });
    };

    const defaultTrigger = (
        <button className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
            <Users size={18} />
            Spravovať tím
        </button>
    );

    return (
        <FormDialog
            open={open}
            onOpenChange={handleOpen}
            trigger={trigger || defaultTrigger}
            title="Spravovať tím projektu"
            description="Pridajte alebo odstráňte členov tímu a upravte ich oprávnenia."
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Uložiť zmeny"
            size="lg"
        >
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin" size={32} />
                    <span className="ml-3 text-gray-600">Načítavam používateľov...</span>
                </div>
            )}

            {isError && (
                <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-600">
                    <AlertCircle size={24} />
                    <div>
                        <p className="font-semibold">Chyba pri načítavaní</p>
                        <p className="text-sm">
                            Nepodarilo sa načítať používateľov. Skúste to znova.
                        </p>
                    </div>
                </div>
            )}

            {!isLoading && !isError && (
                <TeamMemberList
                    allUsers={users}
                    selectedMembers={data.team_members}
                    teamSettings={data.team_settings}
                    onChange={(members, settings) => {
                        setData('team_members', members);
                        setData('team_settings', settings);
                    }}
                    error={errors.team_members}
                />
            )}
        </FormDialog>
    );
};