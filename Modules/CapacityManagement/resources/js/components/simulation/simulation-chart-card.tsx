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
            <CardHeader className="space-y-3 pb-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <CardTitle className="text-sm font-semibold text-gray-800">
                            Burn-down diagram
                        </CardTitle>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                            Os X zobrazuje týždne od dnešného dňa. Os Y
                            zobrazuje zostávajúce hodiny práce na projekte.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-gray-400" />
                            Plán podľa pôvodného termínu
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block h-0.5 w-5 bg-primary" />
                            Simulovaná predikcia
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-red-400" />
                            Simulovaný deadline
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-600">
                    Sivá prerušovaná čiara ukazuje ideálny pokles práce podľa
                    pôvodného plánu. Modrá čiara ukazuje, ako by sa zostávajúce
                    hodiny míňali pri aktuálne nastavených parametroch. Červená
                    zvislá čiara označuje simulovaný deadline.
                </div>
                <BurnDownChart points={points} loading={loading} />
            </CardContent>
        </Card>
    );
}
