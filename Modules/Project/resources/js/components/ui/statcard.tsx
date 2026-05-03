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
        <div className="kpi">
            {/* Header s ikonou */}
            <div className="mb-2 flex items-center text-xs font-medium text-muted-foreground">
                <div
                    className={`${iconBgColor} mr-2 flex-shrink-0 rounded-md p-1.5`}
                >
                    <Icon className={`${iconColor} h-4 w-4`} />
                </div>
                {title}
            </div>

            {/* Hodnota */}
            <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>

            {/* Subtitle (napr. "z 100€") */}
            {subtitle && (
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}

            {/* Progress bar (optional) */}
            {progress !== undefined && (
                <>
                    <Progress
                        value={progress}
                        className="mt-3"
                    />
                    {progressLabel && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {progressLabel}
                        </p>
                    )}
                </>
            )}
        </div>
    );
};
