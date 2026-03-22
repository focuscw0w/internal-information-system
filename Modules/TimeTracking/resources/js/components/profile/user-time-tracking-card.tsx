import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface RecentEntry {
    id: number;
    project_name: string;
    task_title: string;
    hours: number;
    entry_date: string;
    description: string | null;
}

interface TimeTrackingSummary {
    total_hours_this_week: number;
    total_hours_this_month: number;
    recent_entries: RecentEntry[];
}

interface UserTimeTrackingCardProps {
    summary: TimeTrackingSummary;
}

export const UserTimeTrackingCard = ({
    summary,
}: UserTimeTrackingCardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Prehľad času
                </CardTitle>
                <CardDescription>
                    Odpracovaný čas tento týždeň a mesiac.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-6">
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Tento týždeň
                        </p>
                        <p className="text-2xl font-semibold">
                            {summary.total_hours_this_week}h
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Tento mesiac
                        </p>
                        <p className="text-2xl font-semibold">
                            {summary.total_hours_this_month}h
                        </p>
                    </div>
                </div>

                {summary.recent_entries.length > 0 && (
                    <div>
                        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Posledné záznamy
                        </p>
                        <div className="space-y-1.5">
                            {summary.recent_entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm leading-tight font-medium">
                                            {entry.task_title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {entry.project_name}
                                            {entry.description &&
                                                ` · ${entry.description}`}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-medium">
                                            {entry.hours}h
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(
                                                entry.entry_date,
                                            ).toLocaleDateString('sk-SK')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
