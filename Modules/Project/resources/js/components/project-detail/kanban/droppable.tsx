import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';

interface DroppableProps {
    id: string;
    children: ReactNode;
}

export function Droppable({ id, children }: DroppableProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    const style = {
        opacity: isOver ? 0.8 : 1,
        transition: 'opacity 0.2s ease',
    };

    return (
        <div ref={setNodeRef} style={style}>
            {children}
        </div>
    );
}
