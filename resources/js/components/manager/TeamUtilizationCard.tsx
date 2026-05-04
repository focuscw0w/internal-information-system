import { Activity, UserCheck, Users } from 'lucide-react';

export type TeamUtilizationWidget = {
    avg_utilization: number;
    overloaded_count: number;
    free_count: number;
};

export function TeamUtilizationCard({ data }: { data: TeamUtilizationWidget }) {
    return (
        <section className="card">
            <div className="card__head">
                <div>
                    <h3 className="card__title">Vyťaženie tímu</h3>
                    <div className="card__sub">Aktuálny týždeň</div>
                </div>
                <Activity className="h-5 w-5 text-[var(--accent-blue-text)]" />
            </div>
            <div className="card__body space-y-4">
                <div>
                    <div className="kpi__value">
                        {data.avg_utilization}
                        <sub>%</sub>
                    </div>
                    <div className="progress mt-3">
                        <div
                            className={`progress__fill ${data.avg_utilization > 100 ? 'progress__fill--danger' : data.avg_utilization >= 90 ? 'progress__fill--warning' : ''}`}
                            style={{ width: `${Math.min(data.avg_utilization, 100)}%` }}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md border border-border p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            Preťažení
                        </div>
                        <div className="mt-2 text-xl font-semibold">
                            {data.overloaded_count}
                        </div>
                    </div>
                    <div className="rounded-md border border-border p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <UserCheck className="h-4 w-4" />
                            Voľní
                        </div>
                        <div className="mt-2 text-xl font-semibold">
                            {data.free_count}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
