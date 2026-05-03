import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteDialog } from '@/components/dialogs/delete-dialog';
import { useForm } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Project } from 'Modules/Project/resources/js/types/types';
import { TimeEntry } from '../../types/types';
import { EditEntryDialog } from './edit-entry-dialog';

interface EntryRowActionsProps {
    entry: TimeEntry;
    project?: Project;
}

export function EntryRowActions({ entry, project }: EntryRowActionsProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const { delete: destroy, processing } = useForm({});

    const handleDelete = () => {
        destroy(`/projects/${entry.project_id}/time-entries/${entry.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteOpen(false),
        });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button type="button" className="icon-btn">
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                        onSelect={(event) => {
                            event.preventDefault();
                            setEditOpen(true);
                        }}
                        disabled={!project}
                    >
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Upraviť
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={(event) => {
                            event.preventDefault();
                            setDeleteOpen(true);
                        }}
                        className="text-red-600 focus:text-red-700"
                    >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Vymazať
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {project ? (
                <EditEntryDialog
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    entry={entry}
                    projectId={entry.project_id}
                    tasks={project.tasks ?? []}
                />
            ) : null}

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Odstrániť záznam?"
                description={
                    <>
                        Naozaj chceš odstrániť záznam <strong>{entry.hours}h</strong>{' '}
                        z{' '}
                        <strong>
                            {new Date(entry.entry_date).toLocaleDateString('sk-SK')}
                        </strong>
                        ? Akcia je nenávratná.
                    </>
                }
                onConfirm={handleDelete}
                isDeleting={processing}
                confirmLabel="Odstrániť"
            />
        </>
    );
}
