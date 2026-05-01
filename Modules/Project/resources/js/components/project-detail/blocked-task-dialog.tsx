import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FlashWarningBlocked, SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BlockedTaskDialogProps {
    projectId: number;
    taskId: number | null;
}

function isBlockedWarning(value: unknown): value is FlashWarningBlocked {
    return (
        !!value &&
        typeof value === 'object' &&
        (value as { type?: unknown }).type === 'blocked_by'
    );
}

export function BlockedTaskDialog({ projectId, taskId }: BlockedTaskDialogProps) {
    const flash = usePage<SharedData>().props.flash;
    const [warning, setWarning] = useState<FlashWarningBlocked | null>(null);

    useEffect(() => {
        if (isBlockedWarning(flash?.warning)) {
            setWarning(flash.warning);
        }
    }, [flash?.warning]);

    if (!warning || taskId === null) return null;

    const proceed = () => {
        router.patch(
            `/projects/${projectId}/tasks/${taskId}/status?force=1`,
            { status: warning.attempted_status },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['project', 'task', 'flash'],
                onFinish: () => setWarning(null),
            },
        );
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && setWarning(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Úloha má nedokončené predchodcovské úlohy
                    </DialogTitle>
                    <DialogDescription>
                        Nasledujúce úlohy ešte nie sú hotové:
                    </DialogDescription>
                </DialogHeader>

                <ul className="my-2 space-y-1">
                    {warning.blocked_by.map((p) => (
                        <li
                            key={p.id}
                            className="rounded bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                        >
                            {p.title}{' '}
                            <span className="text-xs text-gray-400">
                                ({p.status})
                            </span>
                        </li>
                    ))}
                </ul>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setWarning(null)}>
                        Zrušiť
                    </Button>
                    <Button onClick={proceed}>Pokračovať aj tak</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
