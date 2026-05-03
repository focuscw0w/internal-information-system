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
    icon: _Icon,
    iconColor: _iconColor,
    iconBgColor: _iconBgColor,
    progress,
    progressLabel,
}: StatCardProps) => {
    return (
        <div className="kpi">
            <span className="kpi__label">{title}</span>
            <p className="kpi__value">{value}</p>

            {subtitle && (
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}

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
