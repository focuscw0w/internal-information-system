import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type BurnDownPoint = {
    week_label: string;
    ideal_remaining: number;
    forecast_remaining: number;
    is_deadline_week: boolean;
};

type Props = {
    points: BurnDownPoint[];
    deadlineWeekLabel?: string;
    loading?: boolean;
};

export function BurnDownChart({ points, deadlineWeekLabel, loading = false }: Props) {
    const deadlinePoint = points.find((p) => p.is_deadline_week);
    const deadlineLabel = deadlineWeekLabel ?? deadlinePoint?.week_label;

    return (
        <div className={`relative transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={points} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="week_label"
                        tick={{ fontSize: 10 }}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 10 }}
                        unit=" h"
                        domain={[0, 'auto']}
                        width={60}
                    />
                    <Tooltip
                        formatter={(value, name) => [
                            `${value} h`,
                            name === 'ideal_remaining' ? 'Plán (ideál)' : 'Predikcia',
                        ]}
                        labelFormatter={(label) => `Týždeň ${label}`}
                    />
                    <Legend
                        formatter={(value) =>
                            value === 'ideal_remaining' ? 'Plán (ideál)' : 'Predikcia'
                        }
                    />

                    {/* Deadline reference line */}
                    {deadlineLabel && (
                        <ReferenceLine
                            x={deadlineLabel}
                            stroke="#ef4444"
                            strokeDasharray="4 4"
                            label={{
                                value: 'Deadline',
                                position: 'insideTopRight',
                                fontSize: 10,
                                fill: '#ef4444',
                            }}
                        />
                    )}

                    {/* Ideal burn-down (baseline plan) */}
                    <Line
                        type="monotone"
                        dataKey="ideal_remaining"
                        stroke="#9ca3af"
                        strokeWidth={1.5}
                        strokeDasharray="6 3"
                        dot={false}
                        activeDot={{ r: 3 }}
                    />

                    {/* Simulated forecast */}
                    <Line
                        type="monotone"
                        dataKey="forecast_remaining"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
