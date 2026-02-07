import { Calendar, Users } from 'lucide-react';

interface ProjectMetricsProps {
    startDate: string;
    endDate: string;
    teamSize: number;
}

export const ProjectMetrics = ({
    startDate,
    endDate,
    teamSize,
}: ProjectMetricsProps) => {
    return (
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} />
                <span>
                    {startDate} - {endDate}
                </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
                <Users size={16} />
                <span>{teamSize} členov tímu</span>
            </div>
        </div>
    );
};
