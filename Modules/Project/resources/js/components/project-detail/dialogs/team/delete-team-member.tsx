import { DeleteDialog } from '@/components/dialogs/delete-dialog';
import { useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    Project,
    TeamMember,
    TeamMemberSettings,
} from '../../../../types/types';

interface RemoveTeamMemberDialogProps {
    project: Project;
    member: TeamMember;
}

export const RemoveTeamMemberDialog = ({
    project,
    member,
}: RemoveTeamMemberDialogProps) => {
    const [open, setOpen] = useState(false);

    const remainingMembers = project.team.filter((m) => m.id !== member.id);

    const { delete: destroy, processing } = useForm({
        team_members: remainingMembers.map((m) => m.id),
        team_settings: remainingMembers.reduce(
            (acc, m) => {
                acc[m.id] = {
                    allocation: m.allocation || 100,
                    permissions: Array.isArray(m.permissions)
                        ? m.permissions
                        : [],
                };
                return acc;
            },
            {} as Record<number, TeamMemberSettings>,
        ),
    });

    const handleConfirm = () => {
        destroy(`/projects/${project.id}/team/${member.id}`, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <DeleteDialog
            open={open}
            onOpenChange={setOpen}
            trigger={
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Zmazať projekt"
                >
                    <Trash2 size={25} />
                </button>
            }
            title="Odstrániť člena z tímu?"
            description={
                <>
                    Naozaj chcete odstrániť <strong>{member.name}</strong> z
                    tímu? Člen stratí prístup k projektu a všetkým jeho úlohám.
                </>
            }
            onConfirm={handleConfirm}
            isDeleting={processing}
            confirmLabel="Odstrániť"
        />
    );
};
