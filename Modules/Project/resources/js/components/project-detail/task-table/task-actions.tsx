import { TaskTimerButton } from '../../../../../../TimeTracking/resources/js/components/task-timer-button';
import { Project, Task, TeamMember } from '../../../types/types';
import { DeleteTaskDialog } from './dialogs/delete-task';
import { EditTaskDialog } from './dialogs/edit-task';

interface TaskActionsProps {
    task: Task;
    project: Project;
    team: TeamMember[];
}

export const TaskActions = ({ task, project, team }: TaskActionsProps) => {
    return (
        <div className="flex items-center gap-1">
            <EditTaskDialog task={task} projectId={project.id} team={team} />
            <DeleteTaskDialog task={task} projectId={project.id} />
            <TaskTimerButton project={project} task={task} />
        </div>
    );
};
