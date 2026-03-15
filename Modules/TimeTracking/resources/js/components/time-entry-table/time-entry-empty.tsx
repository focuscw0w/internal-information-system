import { Clock, Filter } from 'lucide-react';
import { CreateTimeEntryDialog } from './dialogs/create-time-entry';
import { Project, Task } from 'Modules/Project/resources/js/types/types';

interface TimeEntryEmptyProps {
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    project: Project;
    tasks: Task[];
}

export const TimeEntryEmpty = ({
    hasActiveFilters,
    onClearFilters,
    project,
    tasks,
}: TimeEntryEmptyProps) => (
    <div className="flex flex-col items-center justify-center py-12">
        {hasActiveFilters ? (
            <>
                <Filter className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">
                    Žiadne záznamy nezodpovedajú filtrom.
                </p>
                <button
                    onClick={onClearFilters}
                    className="mt-4 text-sm text-blue-500 hover:underline"
                >
                    Zrušiť filtre
                </button>
            </>
        ) : (
            <>
                <Clock className="mb-3 h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500">
                    Zatiaľ nie sú zaznamenané žiadne hodiny
                </p>
                <p className="mt-1 text-xs text-gray-400">
                    Začnite zaznamenávať čas strávený na úlohách.
                </p>
                <div className="mt-4">
                    <CreateTimeEntryDialog project={project} tasks={tasks} />
                </div>
            </>
        )}
    </div>
);