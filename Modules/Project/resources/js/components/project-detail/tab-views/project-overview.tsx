import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { Project } from '../../../types/types';
import { StatCard } from '../../ui/statcard';
import { TaskTable } from '../task-list/task-list';

interface ProjectOverviewProps {
    project: Project;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
    const permissions = project.current_user_permissions ?? [];
    const can = (permission: string) => permissions.includes(permission);

    const capacityPercentage =
        project.capacity_available > 0
            ? (project.capacity_used / project.capacity_available) * 100
            : 0;

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Obdobie projektu"
                    value={new Date(project.start_date).toLocaleDateString('sk-SK')}
                    subtitle={`až ${new Date(project.end_date).toLocaleDateString('sk-SK')}`}
                    icon={Calendar}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-50"
                />

                <StatCard
                    title="Kapacita"
                    value={`${project.capacity_used}h`}
                    subtitle={`z ${project.capacity_available}h`}
                    icon={Clock}
                    iconColor="text-amber-600"
                    iconBgColor="bg-amber-50"
                    progress={capacityPercentage}
                    progressLabel={`${capacityPercentage.toFixed(0)}% použité`}
                />

                <StatCard
                    title="Progres"
                    value={`${project.progress}%`}
                    subtitle={`${project.tasks_completed} z ${project.tasks_total} úloh`}
                    icon={TrendingUp}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-50"
                    progress={project.progress}
                />
            </div>

            {can('view_tasks') && <TaskTable project={project} />}
        </div>
    );
}
