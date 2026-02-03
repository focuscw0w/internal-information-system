import { LucideIcon } from 'lucide-react';
import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconColor: string;
    iconBgColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBgColor,
}) => {
    return (
        <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                        {value}
                    </p>
                </div>
                <div className={`${iconBgColor} rounded-lg p-3`}>
                    <Icon className={iconColor} size={24} />
                </div>
            </div>
        </div>
    );
};
