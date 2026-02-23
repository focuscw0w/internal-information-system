import { FormDialog } from '@/components/dialogs/form-dialog';
import { FormField } from '@/components/dialogs/form-field';
import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface CreateSubtaskDialogProps {
    projectId: number;
    taskId: number;
}

export const CreateSubtaskDialog = ({ projectId, taskId }: CreateSubtaskDialogProps) => {
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
                <Button variant="outline" size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Pridať podúlohu
                </Button>
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
