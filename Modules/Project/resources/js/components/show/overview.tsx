import { Calendar, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { Project } from '../../types/types';
import { StatCard } from '../ui/statcard';
import { Allocations } from './allocations';
import { TaskList } from './task-list';

interface OverviewProps {
    project: Project;
}

export function Overview({ project }: OverviewProps) {
    const budgetSpent = project.budget_spent ?? 0;
    const budget = project.budget ?? 0;
    const budgetPercentage = budget > 0 ? (budgetSpent / budget) * 100 : 0;
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
                    value={new Date(project.start_date).toLocaleDateString(
                        'sk-SK',
                    )}
                    subtitle={`až ${new Date(project.end_date).toLocaleDateString('sk-SK')}`}
                    icon={Calendar}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-50"
                />
                <StatCard
                    title="Rozpočet"
                    value={`${budgetSpent.toFixed(2)}€`}
                    subtitle={`z ${budget.toFixed(2)}€`}
                    icon={DollarSign}
                    iconColor="text-emerald-600"
                    iconBgColor="bg-emerald-50"
                    progress={budgetPercentage}
                    progressLabel={`${budgetPercentage.toFixed(0)}% vyčerpané`}
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

            {/* Team Allocations */}
            <Allocations project={project} />

            {/* Tasks List */}
            <TaskList project={project} />
        </div>
    );
}
