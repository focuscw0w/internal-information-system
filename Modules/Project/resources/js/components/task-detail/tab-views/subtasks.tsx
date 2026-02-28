import { Task } from '../../../types/types';
import { SubtaskTable } from '../subtask-table/subtask-table';

interface SubtasksProps {
    task: Task;
    projectId: number;
}

export const Subtasks = ({ task, projectId }: SubtasksProps) => {
    return <SubtaskTable task={task} projectId={projectId} />;
};
