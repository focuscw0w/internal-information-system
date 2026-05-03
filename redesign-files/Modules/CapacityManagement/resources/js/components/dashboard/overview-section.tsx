import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CapacityOverview } from '../../types/capacity';
import { UtilizationBar } from '../shared/utilization';

type OverviewSectionProps = {
    weeklyOverview: CapacityOverview;
    monthlyOverview: CapacityOverview;
};

function OverviewCard({
    title,
    overview,
}: {
    title: string;
    overview: CapacityOverview;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-600">
                    Zaťaženie: {overview.load_hours}h /{' '}
                    {overview.capacity_hours}h ({overview.utilization}%)
                </p>
                <UtilizationBar utilization={overview.utilization} />
            </CardContent>
        </Card>
    );
}

export function OverviewSection({
    weeklyOverview,
    monthlyOverview,
}: OverviewSectionProps) {
    return (
        <section className="grid gap-4 md:grid-cols-2">
            <OverviewCard title="Týždenný prehľad" overview={weeklyOverview} />
            <OverviewCard title="Mesačný prehľad" overview={monthlyOverview} />
        </section>
    );
}
