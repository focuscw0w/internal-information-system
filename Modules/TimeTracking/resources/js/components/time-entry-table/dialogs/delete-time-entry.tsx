import { DeleteDialog } from '@/components/dialogs/delete-dialog';
import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { TimeEntry } from '../../../types/types';

interface DeleteTimeEntryDialogProps {
    entry: TimeEntry;
    projectId: number;
}

export const DeleteTimeEntryDialog = ({
                                          entry,
                                          projectId,
                                      }: DeleteTimeEntryDialogProps) => {
    const [open, setOpen] = useState(false);

    const { delete: destroy, processing } = useForm({});

    const handleConfirm = () => {
        destroy(`/projects/${projectId}/time-entries/${entry.id}`, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <DeleteDialog
            open={open}
            onOpenChange={setOpen}
            trigger={
                <Button variant="ghost" size="sm">
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
            }
            title="Odstrániť záznam?"
            description={
                <>
                    Naozaj chcete odstrániť záznam <strong>{entry.hours}h</strong> z{' '}
                    <strong>
                        {new Date(entry.entry_date).toLocaleDateString('sk-SK')}
                    </strong>
                    ? Táto akcia je nenávratná.
                </>
            }
            onConfirm={handleConfirm}
            isDeleting={processing}
            confirmLabel="Odstrániť"
        />
    );
};
