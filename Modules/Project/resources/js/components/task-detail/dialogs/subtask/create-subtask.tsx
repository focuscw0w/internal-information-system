import { FormDialog } from '@/components/dialogs/form-dialog';
import { FormField } from '@/components/dialogs/form-field';
import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface CreateSubtaskDialogProps {
    projectId: number;
    taskId: number;
}

export const CreateSubtaskDialog = ({
    projectId,
    taskId,
}: CreateSubtaskDialogProps) => {
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(`/projects/${projectId}/tasks/${taskId}/subtasks`, {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={setOpen}
            trigger={
                <button type="button" className="btn btn--sm">
                    <Plus className="h-3.5 w-3.5" />
                    Pridať
                </button>
            }
            title="Nová podúloha"
            description="Pridajte podúlohu k tejto úlohe."
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Vytvoriť"
        >
            <FormField
                label="Názov"
                id="title"
                value={data.title}
                onChange={(value) => setData('title', value)}
                error={errors.title}
                required
                placeholder="napr. Pripraviť dokumentáciu"
            />
        </FormDialog>
    );
};
