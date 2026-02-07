import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconColor: string;
    iconBgColor: string;
}

export const StatCard = ({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBgColor,
}: StatCardProps) => {
    return (
        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 sm:text-sm">{title}</p>
                    <p className="mt-1 truncate text-xl font-bold text-gray-900 sm:text-2xl">
                        {value}
                    </p>
                </div>
                <div className={`${iconBgColor} flex-shrink-0 rounded-lg p-2 sm:p-3`}>
                    <Icon className={iconColor} size={20} />
                </div>
            </div>
        </div>
    );
};