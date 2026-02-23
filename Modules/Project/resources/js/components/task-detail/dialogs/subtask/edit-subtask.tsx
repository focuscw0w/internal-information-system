import { FormDialog } from '@/components/dialogs/form-dialog';
import { FormField } from '@/components/dialogs/form-field';
import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import { Edit } from 'lucide-react';
import { useState } from 'react';
import { Subtask } from '../../../../types/types';

interface EditSubtaskDialogProps {
    subtask: Subtask;
    projectId: number;
    taskId: number;
}

export const EditSubtaskDialog = ({
    subtask,
    projectId,
    taskId,
}: EditSubtaskDialogProps) => {
    const [open, setOpen] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        title: subtask.title,
    });

    const handleOpen = (newOpen: boolean) => {
        if (newOpen) {
            setData('title', subtask.title);
        }
        setOpen(newOpen);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        put(`/projects/${projectId}/tasks/${taskId}/subtasks/${subtask.id}`, {
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={handleOpen}
            trigger={
                <Button variant="ghost" size="sm">
                    <Edit size={20} className="h-3.5 w-3.5 text-gray-400" />
                </Button>
            }
            title="Upraviť podúlohu"
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Uložiť"
        >
            <FormField
                label="Názov"
                id="title"
                value={data.title}
                onChange={(value) => setData('title', value)}
                error={errors.title}
                required
            />
        </FormDialog>
    );
};
