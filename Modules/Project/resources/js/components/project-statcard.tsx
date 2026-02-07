import { Progress } from '@/components/ui/progress';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    iconColor: string;
    iconBgColor: string;
    progress?: number;
    progressLabel?: string;
}

export const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor,
    iconBgColor,
    progress,
    progressLabel,
}: StatCardProps) => {
    return (
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            {/* Header s ikonou */}
            <div className="mb-3 flex items-center text-sm font-medium text-gray-600">
                <div
                    className={`${iconBgColor} mr-3 flex-shrink-0 rounded-lg p-2`}
                >
                    <Icon className={`${iconColor} h-5 w-5`} />
                </div>
                {title}
            </div>

            {/* Hodnota */}
            <p className="text-2xl font-bold text-gray-900">{value}</p>

            {/* Subtitle (napr. "z 100€") */}
            {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}

            {/* Progress bar (optional) */}
            {progress !== undefined && (
                <>
                    <Progress
                        value={progress}
                        className="mt-3 h-2 bg-gray-100"
                    />
                    {progressLabel && (
                        <p className="mt-1 text-xs text-gray-500">
                            {progressLabel}
                        </p>
                    )}
                </>
            )}
        </div>
    );
};
