import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BurnDownPoint } from '../../types/capacity';
import { BurnDownChart } from './burn-down-chart';

type SimulationChartCardProps = {
    points: BurnDownPoint[];
    loading: boolean;
};

export function SimulationChartCard({
    points,
    loading,
}: SimulationChartCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-800">
                    Burn-down diagram
                </CardTitle>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-gray-400" />
                        Plán (ideál)
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-0.5 w-5 bg-primary" />
                        Predikcia
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-red-400" />
                        Deadline
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <BurnDownChart points={points} loading={loading} />
            </CardContent>
        </Card>
    );
}
