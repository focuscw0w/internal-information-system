import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Project } from '../../types/project.types';

interface KanbanProps {
    project: Project;
}

export function Kanban({ project }: KanbanProps) {
    const columns = [
        { id: 'todo', title: 'Na vykonanie', status: 'todo' },
        { id: 'in_progress', title: 'Prebieha', status: 'in_progress' },
        { id: 'testing', title: 'Testovanie', status: 'testing' },
        { id: 'done', title: 'Hotovo', status: 'done' },
    ];

    const getTasksByStatus = (status: string) => {
        return project.tasks?.filter((task) => task.status === status) || [];
    };

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {columns.map((column) => {
                const tasks = getTasksByStatus(column.status);

                return (
                    <Card key={column.id}>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between text-sm font-semibold">
                                {column.title}
                                <span className="rounded-full px-2 py-1 text-xs">
                                    {tasks.length}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {tasks.map((task) => (
                                <Card
                                    key={task.id}
                                    className="cursor-pointer transition-shadow hover:shadow-md"
                                >
                                    <CardContent className="p-3">
                                        <h4 className="mb-2 text-sm font-medium text-gray-900">
                                            {task.title}
                                        </h4>
                                        {task.assigned_user && (
                                            <p className="text-xs text-gray-500">
                                                👤 {task.assigned_user.name}
                                            </p>
                                        )}
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-xs text-gray-500">
                                                {task.actual_hours}h /{' '}
                                                {task.estimated_hours}h
                                            </span>
                                            {task.priority === 'high' && (
                                                <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                                                    Vysoká
                                                </span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {tasks.length === 0 && (
                                <p className="py-8 text-center text-sm text-gray-400">
                                    Žiadne úlohy
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
