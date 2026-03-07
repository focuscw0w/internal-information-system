import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { TimeEntry } from '../types/types';

interface WeeklyChartProps {
    entries: TimeEntry[];
}

const DAY_LABELS = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];

/**
 * Get Monday of the week for a given date.
 */
const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Format date range as "1. mar – 7. mar 2026".
 */
const formatWeekRange = (monday: Date): string => {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const start = monday.toLocaleDateString('sk-SK', opts);
    const end = sunday.toLocaleDateString('sk-SK', { ...opts, year: 'numeric' });

    return `${start} – ${end}`;
};

/**
 * Get array of date strings (YYYY-MM-DD) for Mon–Sun.
 */
const getWeekDates = (monday: Date): string[] => {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toISOString().split('T')[0];
    });
};

export const WeeklyChart = ({ entries }: WeeklyChartProps) => {
    const [weekOffset, setWeekOffset] = useState(0);

    const today = new Date();
    const currentMonday = getMonday(today);
    currentMonday.setDate(currentMonday.getDate() + weekOffset * 7);

    const weekDates = getWeekDates(currentMonday);
    const isCurrentWeek = weekOffset === 0;

    console.log(entries);

    // Aggregate hours per day
    const dailyHours = weekDates.map((date) =>
        entries
            .filter((e) => e.entry_date.substring(0, 10) === date)
            .reduce((sum, e) => sum + Number(e.hours), 0),
    );

    const totalHours = dailyHours.reduce((a, b) => a + b, 0);
    const maxHours = Math.max(...dailyHours, 1);

    return (
        <Card className="border-gray-100 bg-white shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        Týždenný prehľad
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            ({totalHours.toFixed(1)}h)
                        </span>
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setWeekOffset((o) => o - 1)}
                            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="min-w-[180px] text-center text-sm text-gray-600">
                            {formatWeekRange(currentMonday)}
                        </span>
                        <button
                            onClick={() => setWeekOffset((o) => o + 1)}
                            disabled={isCurrentWeek}
                            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
                    {dailyHours.map((hours, i) => {
                        const heightPercent = maxHours > 0 ? (hours / maxHours) * 100 : 0;
                        const isToday =
                            weekDates[i] === today.toISOString().split('T')[0];

                        return (
                            <div
                                key={weekDates[i]}
                                className="flex flex-1 flex-col items-center gap-1"
                            >
                                {/* Hours label */}
                                <span className="text-xs text-gray-500">
                                    {hours > 0 ? `${hours}h` : ''}
                                </span>

                                {/* Bar */}
                                <div className="flex w-full justify-center" style={{ height: 120 }}>
                                    <div className="flex w-full max-w-10 items-end">
                                        <div
                                            className={`w-full rounded-t transition-all ${
                                                isToday
                                                    ? 'bg-blue-500'
                                                    : hours > 0
                                                        ? 'bg-blue-200'
                                                        : 'bg-gray-100'
                                            }`}
                                            style={{
                                                height: `${Math.max(heightPercent, hours > 0 ? 4 : 2)}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Day label */}
                                <span
                                    className={`text-xs font-medium ${
                                        isToday ? 'text-blue-600' : 'text-gray-500'
                                    }`}
                                >
                                    {DAY_LABELS[i]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
