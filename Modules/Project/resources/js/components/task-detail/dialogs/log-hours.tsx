import { FormDialog } from '@/components/dialogs/form-dialog';
import { FormField } from '@/components/dialogs/form-field';
import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import { useState } from 'react';

interface LogHoursDialogProps {
    taskId: number;
    projectId: number;
}

export const LogHoursDialog = ({ taskId, projectId }: LogHoursDialogProps) => {
    const [open, setOpen] = useState(false);

    const { data, setData, patch, processing, errors, reset } = useForm({
        hours: '',
    });

    const handleOpen = (newOpen: boolean) => {
        if (!newOpen) reset();
        setOpen(newOpen);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        patch(`/projects/${projectId}/tasks/${taskId}/log-hours`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={handleOpen}
            trigger={
                <Button
                    variant="default"
                    size="lg"
                    className="flex items-center gap-2"
                >
                    <Clock className="h-4 w-4" />
                    Pridať hodiny
                </Button>
            }
            title="Zaznamenať odpracované hodiny"
            description="Zadajte počet hodín ktoré chcete pridať k skutočne odpracovanému času."
            onSubmit={handleSubmit}
            processing={processing}
            submitLabel="Zaznamenať"
        >
            <FormField
                label="Počet hodín"
                id="hours"
                type="number"
                value={data.hours}
                onChange={(value) => setData('hours', value)}
                error={errors.hours}
                placeholder="napr. 2.5"
                min={0.5}
                step="0.5"
                required
            />
        </FormDialog>
    );
};
