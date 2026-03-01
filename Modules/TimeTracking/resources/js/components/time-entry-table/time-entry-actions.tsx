import { Task } from 'Modules/Project/resources/js/types/types';
import { TimeEntry } from '../../types/types';
import { EditTimeEntryDialog } from './dialogs/edit-time-entry';
import { DeleteTimeEntryDialog } from './dialogs/delete-time-entry';

interface TimeEntryActionsProps {
    entry: TimeEntry;
    projectId: number;
    tasks: Task[];
}

export const TimeEntryActions = ({
                                     entry,
                                     projectId,
                                     tasks,
                                 }: TimeEntryActionsProps) => {
    return (
        <div className="flex items-center gap-1">
            <EditTimeEntryDialog
                entry={entry}
                projectId={projectId}
                tasks={tasks}
            />
            <DeleteTimeEntryDialog entry={entry} projectId={projectId} />
        </div>
    );
};
