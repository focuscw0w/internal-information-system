import { getAvatarColor } from '@/lib/avatar-color';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { CircleDashed, Filter, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Project, Task, TaskPriority, TaskStatus } from '../../../types/types';
import { GanttArrows } from './gantt-arrows';

const DAY_WIDTH = 28;
const LEFT_PANEL_WIDTH = 224; // w-56

const MONTHS_SK = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Máj',
    'Jún',
    'Júl',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Dec',
];

const STATUS_BG: Record<TaskStatus, string> = {
    todo: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    testing: 'bg-amber-500',
    done: 'bg-green-500',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'Prebieha',
    testing: 'Testovanie',
    done: 'Hotovo',
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
    low: 'bg-gray-300',
    medium: 'bg-yellow-400',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
    low: 'Nízka',
    medium: 'Stredná',
    high: 'Vysoká',
    urgent: 'Urgentná',
};

function initials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

interface GanttChartProps {
    project: Project;
}

export function GanttChart({ project }: GanttChartProps) {
    const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | null>(
        null,
    );
    const [assigneeFilter, setAssigneeFilter] = useState<number | null>(null);
    const [showDependencies, setShowDependencies] = useState<boolean>(
        () => (project.tasks?.length ?? 0) <= 50,
    );

    const projectStart = dayjs(project.start_date);
    const projectEnd = dayjs(project.end_date);
    const totalDays = Math.max(1, projectEnd.diff(projectStart, 'day') + 1);
    const timelineWidth = totalDays * DAY_WIDTH;
    const todayOffset = dayjs().diff(projectStart, 'day');
    const todayVisible = todayOffset >= 0 && todayOffset < totalDays;

    const months = useMemo(() => {
        const start = dayjs(project.start_date);
        const end = dayjs(project.end_date);
        const result: {
            label: string;
            startOffset: number;
            widthPx: number;
        }[] = [];
        let current = start.startOf('month');

        while (!current.isAfter(end)) {
            const monthStart = current.isBefore(start) ? start : current;
            const monthEnd = current.endOf('month').isAfter(end)
                ? end
                : current.endOf('month');
            result.push({
                label: `${MONTHS_SK[current.month()]} ${current.year()}`,
                startOffset: monthStart.diff(start, 'day'),
                widthPx: (monthEnd.diff(monthStart, 'day') + 1) * DAY_WIDTH,
            });
            current = current.add(1, 'month').startOf('month');
        }
        return result;
    }, [project.start_date, project.end_date]);

    const weeks = useMemo(() => {
        const start = dayjs(project.start_date);
        const end = dayjs(project.end_date);
        const result: { label: string; offsetPx: number }[] = [];
        let current = start;

        while (!current.isAfter(end)) {
            result.push({
                label: current.format('D.M'),
                offsetPx: current.diff(start, 'day') * DAY_WIDTH,
            });
            current = current.add(7, 'day');
        }
        return result;
    }, [project.start_date, project.end_date]);

    const assignees = useMemo(() => {
        const map = new Map<number, string>();
        project.tasks.forEach((t) =>
            t.assigned_users?.forEach((u) => map.set(u.id, u.name)),
        );
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [project.tasks]);

    const filteredTasks = useMemo(() => {
        return project.tasks.filter((task) => {
            if (statusFilter && task.status !== statusFilter) return false;
            if (priorityFilter && task.priority !== priorityFilter)
                return false;
            if (
                assigneeFilter &&
                !task.assigned_users?.some((u) => u.id === assigneeFilter)
            )
                return false;
            return true;
        });
    }, [project.tasks, statusFilter, priorityFilter, assigneeFilter]);

    const hasFilters = Boolean(
        statusFilter || priorityFilter || assigneeFilter,
    );

    function getBar(task: Task): { leftPx: number; widthPx: number } {
        const start = dayjs(task.start_date ?? project.start_date);
        const end = task.due_date ? dayjs(task.due_date) : projectEnd;
        // Clamp both ends to the visible timeline so tasks whose dates fall
        // outside the project range don't render bars beyond the grid (which
        // would create phantom horizontal scroll space).
        const startDay = Math.min(
            totalDays - 1,
            Math.max(0, start.diff(projectStart, 'day')),
        );
        const endDay = Math.max(
            startDay,
            Math.min(totalDays - 1, end.diff(projectStart, 'day')),
        );
        const durationDays = endDay - startDay + 1;
        return {
            leftPx: startDay * DAY_WIDTH,
            widthPx: durationDays * DAY_WIDTH,
        };
    }

    return (
        <div className="space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />

                <select
                    value={statusFilter ?? ''}
                    onChange={(e) =>
                        setStatusFilter((e.target.value as TaskStatus) || null)
                    }
                    className="rounded-md border border-gray-200 bg-card px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                >
                    <option value="">Všetky stavy</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">Prebieha</option>
                    <option value="testing">Testovanie</option>
                    <option value="done">Hotovo</option>
                </select>

                <select
                    value={priorityFilter ?? ''}
                    onChange={(e) =>
                        setPriorityFilter(
                            (e.target.value as TaskPriority) || null,
                        )
                    }
                    className="rounded-md border border-gray-200 bg-card px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                >
                    <option value="">Všetky priority</option>
                    <option value="urgent">Urgentná</option>
                    <option value="high">Vysoká</option>
                    <option value="medium">Stredná</option>
                    <option value="low">Nízka</option>
                </select>

                {assignees.length > 0 && (
                    <select
                        value={assigneeFilter ?? ''}
                        onChange={(e) =>
                            setAssigneeFilter(
                                e.target.value ? Number(e.target.value) : null,
                            )
                        }
                        className="rounded-md border border-gray-200 bg-card px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="">Všetci členovia</option>
                        {assignees.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </select>
                )}

                {hasFilters && (
                    <>
                        <button
                            onClick={() => {
                                setStatusFilter(null);
                                setPriorityFilter(null);
                                setAssigneeFilter(null);
                            }}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        >
                            <X className="h-3 w-3" />
                            Zrušiť filtre
                        </button>
                        <span className="text-xs text-gray-400">
                            {filteredTasks.length} z {project.tasks.length}
                        </span>
                    </>
                )}

                <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
                    <input
                        type="checkbox"
                        checked={showDependencies}
                        onChange={(e) => setShowDependencies(e.target.checked)}
                        className="h-3.5 w-3.5"
                    />
                    Zobraziť závislosti
                </label>
            </div>

            {/* Gantt grid */}
            <div className="max-w-full overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16">
                        <CircleDashed className="h-12 w-12 text-gray-300" />
                        <p className="text-sm text-gray-400">
                            Žiadne úlohy na zobrazenie
                        </p>
                    </div>
                ) : (
                    <div className="relative overflow-x-auto">
                        {/* Month header */}
                        <div
                            className="flex border-b border-gray-200 bg-gray-50"
                            style={{
                                minWidth: `${LEFT_PANEL_WIDTH + timelineWidth}px`,
                            }}
                        >
                            <div className="sticky left-0 z-20 flex w-56 flex-shrink-0 items-center border-r border-gray-200 bg-gray-50 px-4 py-2">
                                <span className="text-xs font-semibold text-gray-500">
                                    Úloha
                                </span>
                            </div>
                            <div
                                className="relative flex-1"
                                style={{
                                    width: `${timelineWidth}px`,
                                    height: '32px',
                                }}
                            >
                                {months.map((m, i) => (
                                    <div
                                        key={i}
                                        className="absolute top-0 flex h-full items-center overflow-hidden border-l border-gray-200 px-2"
                                        style={{
                                            left: `${m.startOffset * DAY_WIDTH}px`,
                                            width: `${m.widthPx}px`,
                                        }}
                                    >
                                        <span className="truncate text-xs font-medium text-gray-600">
                                            {m.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Week sub-header */}
                        <div
                            className="flex border-b border-gray-200 bg-gray-50"
                            style={{
                                minWidth: `${LEFT_PANEL_WIDTH + timelineWidth}px`,
                            }}
                        >
                            <div
                                className="sticky left-0 z-20 w-56 flex-shrink-0 border-r border-gray-200 bg-gray-50"
                                style={{ height: '24px' }}
                            />
                            <div
                                className="relative flex-1"
                                style={{
                                    width: `${timelineWidth}px`,
                                    height: '24px',
                                }}
                            >
                                {weeks.map((w, i) => (
                                    <div
                                        key={i}
                                        className="absolute top-0 flex h-full items-center overflow-hidden border-l border-gray-100 pl-1"
                                        style={{
                                            left: `${w.offsetPx}px`,
                                            width: `${7 * DAY_WIDTH}px`,
                                        }}
                                    >
                                        <span className="text-[10px] text-gray-400">
                                            {w.label}
                                        </span>
                                    </div>
                                ))}
                                {todayVisible && (
                                    <div
                                        className="absolute top-0 bottom-0 z-10 w-0.5 bg-red-400"
                                        style={{
                                            left: `${(todayOffset + 0.5) * DAY_WIDTH}px`,
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Task rows */}
                        {filteredTasks.map((task, i) => {
                            const bar = getBar(task);
                            const rowBg = i % 2 === 0 ? '#ffffff' : '#f9fafb';

                            return (
                                <div
                                    key={task.id}
                                    onClick={() =>
                                        router.visit(
                                            `/projects/${project.id}/tasks/${task.id}`,
                                        )
                                    }
                                    className="flex cursor-pointer border-b border-gray-100 transition-colors last:border-0 hover:bg-blue-50"
                                    style={{
                                        minWidth: `${LEFT_PANEL_WIDTH + timelineWidth}px`,
                                        height: '44px',
                                        background: rowBg,
                                    }}
                                >
                                    {/* Left: task name + status dot + assignee avatars */}
                                    <div
                                        className="sticky left-0 z-10 flex w-56 flex-shrink-0 items-center gap-2 border-r border-gray-100 px-3"
                                        style={{ background: rowBg }}
                                    >
                                        <span
                                            className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_BG[task.status]}`}
                                        />
                                        <span
                                            className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700"
                                            title={task.title}
                                        >
                                            {task.title}
                                        </span>
                                        <div className="flex flex-shrink-0 -space-x-1">
                                            {task.assigned_users
                                                ?.slice(0, 2)
                                                .map((u) => (
                                                    <div
                                                        key={u.id}
                                                        className={`flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-white ${getAvatarColor(u.name)}`}
                                                        title={u.name}
                                                    >
                                                        <span className="text-[9px] font-bold text-white">
                                                            {initials(u.name)}
                                                        </span>
                                                    </div>
                                                ))}
                                            {(task.assigned_users?.length ??
                                                0) > 2 && (
                                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 ring-1 ring-white">
                                                    <span className="text-[9px] font-bold text-gray-600">
                                                        +
                                                        {task.assigned_users!
                                                            .length - 2}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: timeline with task bar */}
                                    <div
                                        className="relative flex-1"
                                        style={{
                                            width: `${timelineWidth}px`,
                                            height: '44px',
                                        }}
                                    >
                                        {/* Week grid lines */}
                                        {weeks.map((w, wi) => (
                                            <div
                                                key={wi}
                                                className="pointer-events-none absolute top-0 bottom-0 border-l border-gray-100"
                                                style={{
                                                    left: `${w.offsetPx}px`,
                                                }}
                                            />
                                        ))}

                                        {/* Today line */}
                                        {todayVisible && (
                                            <div
                                                className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-red-200"
                                                style={{
                                                    left: `${(todayOffset + 0.5) * DAY_WIDTH}px`,
                                                }}
                                            />
                                        )}

                                        {/* Task bar */}
                                        <div
                                            className={`absolute top-1/2 flex -translate-y-1/2 items-center overflow-hidden rounded px-1.5 ${STATUS_BG[task.status]}`}
                                            style={{
                                                left: `${bar.leftPx}px`,
                                                width: `${bar.widthPx}px`,
                                                height: '24px',
                                            }}
                                            title={`${task.title} · ${STATUS_LABEL[task.status]} · Priorita: ${PRIORITY_LABEL[task.priority]}`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
                                            />
                                            {bar.widthPx > 80 && (
                                                <span className="ml-1.5 truncate text-[10px] font-medium text-white">
                                                    {task.title}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {showDependencies && (
                            <GanttArrows
                                tasks={filteredTasks}
                                timelineWidth={timelineWidth}
                                rowHeight={44}
                                headerHeight={56}
                                leftPanelWidth={LEFT_PANEL_WIDTH}
                                getBar={getBar}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
