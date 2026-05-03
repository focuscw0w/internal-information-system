interface ProgressBarProps {
    label: string;
    value: number;
    maxValue?: number;
    color?: string;
    showPercentage?: boolean;
}

export const ProgressBar = ({
    label,
    value,
    maxValue = 100,
    color = 'bg-blue-600',
    showPercentage = true,
}: ProgressBarProps) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

    return (
        <div>
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>{label}</span>
                {showPercentage && (
                    <span className="font-medium text-foreground">
                        {Math.round(percentage)}%
                    </span>
                )}
            </div>
            <div className="progress">
                <div
                    className={`${color} h-full rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
