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
            <div className="mb-2 flex justify-between text-sm text-gray-600">
                <span>{label}</span>
                {showPercentage && (
                    <span className="font-medium">
                        {Math.round(percentage)}%
                    </span>
                )}
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                    className={`${color} h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
