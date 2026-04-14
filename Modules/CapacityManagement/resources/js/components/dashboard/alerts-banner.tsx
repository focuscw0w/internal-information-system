import type { CapacityAlert } from '../../types/capacity';

type AlertsBannerProps = {
    alerts: CapacityAlert[];
};

export function AlertsBanner({ alerts }: AlertsBannerProps) {
    if (alerts.length === 0) {
        return null;
    }

    return (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-medium">
                Automatické upozornenie: prekročená kapacita nad 100%.
            </p>
            <ul className="mt-2 list-inside list-disc text-sm">
                {alerts.map((alert) => (
                    <li key={alert.id}>
                        {alert.name}: {alert.weekly_utilization}%
                    </li>
                ))}
            </ul>
        </div>
    );
}
