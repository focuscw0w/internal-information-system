import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { TimeEntry } from '../../types/types';

interface EntryDetailDialogProps {
    entry: TimeEntry | null;
    projectName?: string;
    projectColor?: string;
    showUser?: boolean;
    onOpenChange: (open: boolean) => void;
}

const formatHours = (hours: number) =>
    Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('sk-SK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('sk-SK', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const statusBadge = (status: TimeEntry['status']) => {
    if (status === 'pending') {
        return { className: 'badge badge--warning', label: 'Čaká na schválenie' };
    }
    if (status === 'rejected') {
        return { className: 'badge badge--danger', label: 'Zamietnuté' };
    }
    return { className: 'badge badge--success', label: 'Schválené' };
};

function DetailRow({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5">
            <span className="shrink-0 text-sm text-muted-foreground">
                {label}
            </span>
            <span className="min-w-0 text-right text-sm font-medium text-foreground">
                {children}
            </span>
        </div>
    );
}

export function EntryDetailDialog({
    entry,
    projectName,
    projectColor,
    showUser = false,
    onOpenChange,
}: EntryDetailDialogProps) {
    const badge = entry ? statusBadge(entry.status) : null;

    return (
        <Dialog open={entry !== null} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                {entry && (
                    <>
                        <DialogHeader>
                            <DialogTitle>
                                {entry.task?.title ?? 'Bez úlohy'}
                            </DialogTitle>
                            <DialogDescription>
                                Detail záznamu o odpracovanom čase
                            </DialogDescription>
                        </DialogHeader>

                        <div className="divide-y divide-border">
                            <DetailRow label="Projekt">
                                <span className="inline-flex items-center gap-2">
                                    <span
                                        className="size-2.5 shrink-0 rounded-sm"
                                        style={{
                                            background:
                                                projectColor ??
                                                'var(--accent-blue)',
                                        }}
                                    />
                                    {projectName ?? 'Projekt'}
                                </span>
                            </DetailRow>

                            {showUser && entry.user?.name && (
                                <DetailRow label="Používateľ">
                                    {entry.user.name}
                                </DetailRow>
                            )}

                            <DetailRow label="Dátum">
                                {formatDate(entry.entry_date)}
                            </DetailRow>

                            <DetailRow label="Odpracované">
                                <span className="mono">
                                    {formatHours(Number(entry.hours))}
                                </span>
                            </DetailRow>

                            <DetailRow label="Stav">
                                {badge && (
                                    <span className={badge.className}>
                                        {badge.label}
                                    </span>
                                )}
                            </DetailRow>

                            {entry.status === 'approved' &&
                                entry.approved_at && (
                                    <DetailRow label="Schválené dňa">
                                        {formatDateTime(entry.approved_at)}
                                    </DetailRow>
                                )}

                            {entry.status === 'rejected' &&
                                entry.rejection_reason && (
                                    <DetailRow label="Dôvod zamietnutia">
                                        {entry.rejection_reason}
                                    </DetailRow>
                                )}

                            <DetailRow label="Vytvorené">
                                {formatDateTime(entry.created_at)}
                            </DetailRow>
                        </div>

                        {entry.description ? (
                            <div className="rounded-md bg-muted/60 p-3">
                                <p className="mb-1 text-xs font-medium text-muted-foreground">
                                    Poznámka
                                </p>
                                <p className="text-sm whitespace-pre-wrap text-foreground">
                                    {entry.description}
                                </p>
                            </div>
                        ) : null}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
