import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { Clock3 } from 'lucide-react';

export interface TimeWeekToDate {
    week_start: string;
    week_end: string;
    logged_hours: number;
    today_hours: number;
    entries_count: number;
}

function formatDate(date: string) {
    return new Intl.DateTimeFormat('sk-SK', {
        day: 'numeric',
        month: 'short',
    }).format(new Date(date));
}

function formatHours(hours: number) {
    return new Intl.NumberFormat('sk-SK', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(hours);
}

function MetricRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-semibold text-gray-900">{value}</span>
        </div>
    );
}

interface TimeWeekToDateCardProps {
    data: TimeWeekToDate;
}

export const TimeWeekToDateCard = ({ data }: TimeWeekToDateCardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-emerald-500" />
                    Hodiny týždeň-to-date
                </CardTitle>
                <CardDescription>
                    Od {formatDate(data.week_start)} do{' '}
                    {formatDate(data.week_end)}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <MetricRow
                    label="Dnes"
                    value={`${formatHours(data.today_hours)} h`}
                />
                <MetricRow
                    label="Tento týždeň"
                    value={`${formatHours(data.logged_hours)} h`}
                />
                <MetricRow
                    label="Počet záznamov"
                    value={String(data.entries_count)}
                />
                <Button variant="default" className="w-full" asChild>
                    <Link href="/time-tracking">Otvoriť time tracking</Link>
                </Button>
            </CardContent>
        </Card>
    );
};
