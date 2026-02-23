import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Task } from '../../../types/types';
import { AssignTaskDialog } from '../dialogs/assign-users';

interface AssigneesProps {
    task: Task;
    projectId: number;
}

export const Assignees = ({ task, projectId }: AssigneesProps) => {
    const assignees = task.assigned_users ?? [];

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <AssignTaskDialog task={task} projectId={projectId} />
            </div>
            <Card className="border-gray-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">
                        Priradení
                        {assignees.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({assignees.length})
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {assignees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Users className="mb-3 h-10 w-10 text-gray-300" />
                            <p className="text-sm text-gray-500">
                                Nikto nie je priradený k tejto úlohe.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {assignees.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/30 p-4"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white">
                                        {user.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                            .toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {user.name}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
