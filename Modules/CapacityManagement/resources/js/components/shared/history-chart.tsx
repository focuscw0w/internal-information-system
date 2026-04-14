import {
    Area,
    AreaChart,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { WeekPoint } from '../../types/capacity';

type HistoryChartProps = {
    data: WeekPoint[];
    height?: number;
};

export function HistoryChart({ data, height = 160 }: HistoryChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart
                data={data}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
                <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="#6366f1"
                            stopOpacity={0.3}
                        />
                        <stop
                            offset="95%"
                            stopColor="#6366f1"
                            stopOpacity={0}
                        />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="week_label"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 'auto']} />
                <Tooltip
                    formatter={(value) => [`${value}%`, 'Využitie']}
                    labelFormatter={(label) => `Týždeň ${label}`}
                />
                <ReferenceLine
                    y={100}
                    stroke="#ef4444"
                    strokeDasharray="4 2"
                    label={{ value: '100%', fontSize: 10, fill: '#ef4444' }}
                />
                <ReferenceLine
                    y={80}
                    stroke="#f97316"
                    strokeDasharray="4 2"
                    label={{ value: '80%', fontSize: 10, fill: '#f97316' }}
                />
                <Area
                    type="monotone"
                    dataKey="utilization"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#histGrad)"
                    dot={false}
                    activeDot={{ r: 4 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
