import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type TeamHoursWidget = {
    from: string;
    to: string;
    members: {
        user_id: number;
        name: string;
        hours: number;
    }[];
};

export function TeamHoursThisWeekCard({ data }: { data: TeamHoursWidget }) {
    return (
        <section className="card">
            <div className="card__head">
                <div>
                    <h3 className="card__title">Tímové hodiny</h3>
                    <div className="card__sub">
                        {data.from} - {data.to}
                    </div>
                </div>
            </div>
            <div className="card__body">
                {data.members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Bez záznamov za obdobie.</p>
                ) : (
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.members} layout="vertical" margin={{ left: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={100}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip formatter={(value) => [`${value} h`, 'Hodiny']} />
                                <Bar dataKey="hours" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </section>
    );
}
