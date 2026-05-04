import { Link } from '@inertiajs/react';
import { CheckCheck } from 'lucide-react';

export type PendingApprovalsWidget = {
    count: number;
};

export function PendingApprovalsCard({ data }: { data: PendingApprovalsWidget }) {
    return (
        <section className="card">
            <div className="card__head">
                <div>
                    <h3 className="card__title">Čakajúce schválenia</h3>
                    <div className="card__sub">Time entries vo fronte</div>
                </div>
                <CheckCheck className="h-5 w-5 text-[var(--success-text)]" />
            </div>
            <div className="card__body">
                <div className="kpi__value">
                    {data.count}
                    <sub>záznamov</sub>
                </div>
                <Link href="/manager/time/approvals" className="btn btn--primary mt-4">
                    Review
                </Link>
            </div>
        </section>
    );
}
