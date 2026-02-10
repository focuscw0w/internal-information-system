import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Project } from '../../types/project.types';

interface TimelineProps {
    project: Project;
}

export function Timeline({ project }: TimelineProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Časová os projektu
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 border-l-2 border-blue-500 py-2 pl-4">
                        <div className="text-sm text-gray-500">
                            {new Date(project.start_date).toLocaleDateString(
                                'sk-SK',
                            )}
                        </div>
                        <div>
                            <p className="font-medium">Začiatok projektu</p>
                            <p className="text-sm text-gray-500">
                                Projekt bol vytvorený
                            </p>
                        </div>
                    </div>

                    {project.tasks?.map((task) => (
                        <div
                            key={task.id}
                            className="flex items-center gap-4 border-l-2 border-gray-300 py-2 pl-4"
                        >
                            <div className="text-sm text-gray-500">
                                {task.due_date &&
                                    new Date(task.due_date).toLocaleDateString(
                                        'sk-SK',
                                    )}
                            </div>
                            <div>
                                <p className="font-medium">{task.title}</p>
                                <p className="text-sm text-gray-500">
                                    {task.status === 'done'
                                        ? '✅ Dokončené'
                                        : '⏳ V procese'}
                                </p>
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center gap-4 border-l-2 border-green-500 py-2 pl-4">
                        <div className="text-sm text-gray-500">
                            {new Date(project.end_date).toLocaleDateString(
                                'sk-SK',
                            )}
                        </div>
                        <div>
                            <p className="font-medium">Deadline projektu</p>
                            <p className="text-sm text-gray-500">
                                {project.days_remaining > 0
                                    ? `Zostáva ${project.days_remaining} dní`
                                    : 'Projekt skončil'}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
