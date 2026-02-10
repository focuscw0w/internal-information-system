import { Task, TeamMember } from '../../types/project.types';
import { DeleteTaskDialog } from './dialogs/delete-task';
import { EditTaskDialog } from './dialogs/edit-task';

interface TaskActionsProps {
    task: Task;
    projectId: number;
    team: TeamMember[];
}

export const TaskActions = ({
    task,
    projectId,
    team,
}: TaskActionsProps) => {
    return (
        <div className="flex items-center gap-1">
            <EditTaskDialog task={task} projectId={projectId} team={team} />
            <DeleteTaskDialog task={task} projectId={projectId} />
        </div>
    );
};
