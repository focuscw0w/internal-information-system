import { FormDialog } from '@/components/dialogs/form-dialog';
import { useUsers } from '@/hooks/use-users';
import { useForm } from '@inertiajs/react';
import { AlertCircle, Loader2, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TeamMemberSelect } from '../../ui/team-member-select';
import { Task } from '../../../types/types';

interface AssignTaskDialogProps {
    task: Task;
    projectId: number;
}

export const AssignTaskDialog = ({ task, projectId }: AssignTaskDialogProps) => {
    const [open, setOpen] = useState(false);

    const { data: users = [], isLoading, isError } = useUsers();

    const initialMembers = task.assigned_users?.map((u) => u.id) ?? [];

    const { data, setData, post, processing } = useForm({
        assigned_users: initialMembers,
    });

    const handleOpen = (newOpen: boolean) => {
        if (newOpen) {
            setData('assigned_users', initialMembers);
        }
        setOpen(newOpen);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(`/projects/${projectId}/tasks/${task.id}/assign`, {
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={handleOpen}
            trigger={
                <Button size="lg" variant="default">
                    <Users size={18} />
                    Priradiť ľudí
                </Button>
            }
            title="Priradiť členov"
            description="Vyberte členov tímu pre túto úlohu."
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Uložiť"
        >
            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="ml-2 text-gray-600">
                        Načítavam používateľov...
                    </span>
                </div>
            )}

            {isError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-600">
                    <AlertCircle size={20} />
                    <span>
                        Nepodarilo sa načítať používateľov. Skúste to znova.
                    </span>
                </div>
            )}

            {!isLoading && !isError && (
                <TeamMemberSelect
                    allUsers={users}
                    selectedMembers={data.assigned_users}
                    onChange={(members) => setData('assigned_users', members)}
                />
            )}
        </FormDialog>
    );
};
