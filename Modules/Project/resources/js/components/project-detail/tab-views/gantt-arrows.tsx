import { Task } from '../../../types/types';

interface GanttArrowsProps {
    tasks: Task[];
    timelineWidth: number;
    rowHeight: number;
    headerHeight: number;
    leftPanelWidth: number;
    getBar: (task: Task) => { leftPx: number; widthPx: number };
}

const ARROW_OFFSET = 8;

export function GanttArrows({
    tasks,
    timelineWidth,
    rowHeight,
    headerHeight,
    leftPanelWidth,
    getBar,
}: GanttArrowsProps) {
    const taskIndexById = new Map<number, number>();
    tasks.forEach((task, idx) => taskIndexById.set(task.id, idx));

    const totalHeight = headerHeight + rowHeight * tasks.length;

    const lines: React.ReactNode[] = [];

    tasks.forEach((task, taskIdx) => {
        (task.predecessor_ids ?? []).forEach((predId) => {
            const predIdx = taskIndexById.get(predId);
            if (predIdx === undefined) return;

            const pred = tasks[predIdx];
            const predBar = getBar(pred);
            const succBar = getBar(task);

            const x1 = predBar.leftPx + predBar.widthPx;
            const y1 = headerHeight + predIdx * rowHeight + rowHeight / 2;
            const x2 = succBar.leftPx;
            const y2 = headerHeight + taskIdx * rowHeight + rowHeight / 2;

            const elbowX = Math.max(x1 + ARROW_OFFSET, x2 - ARROW_OFFSET);

            const points = `${x1},${y1} ${elbowX},${y1} ${elbowX},${y2} ${x2},${y2}`;

            lines.push(
                <polyline
                    key={`${pred.id}-${task.id}`}
                    points={points}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    markerEnd="url(#gantt-arrowhead)"
                />,
            );
        });
    });

    if (lines.length === 0) return null;

    return (
        <svg
            className="pointer-events-none absolute"
            style={{
                left: leftPanelWidth,
                top: 0,
                width: timelineWidth,
                height: totalHeight,
                zIndex: 5,
            }}
            width={timelineWidth}
            height={totalHeight}
        >
            <defs>
                <marker
                    id="gantt-arrowhead"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L0,6 L5,3 z" fill="#94a3b8" />
                </marker>
            </defs>
            {lines}
        </svg>
    );
}
