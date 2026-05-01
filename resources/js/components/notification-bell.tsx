import { router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowRightLeft,
    Bell,
    Clock,
    Flame,
    KeyRound,
    RefreshCw,
    TrendingDown,
    UserPlus,
    X,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    useDeleteAllNotifications,
    useDeleteNotification,
    useMarkAllAsRead,
    useMarkAsRead,
    useNotifications,
} from '@/hooks/use-notifications';
import {
    type AppNotification,
    type AppNotificationType,
    type SharedData,
} from '@/types';

function getNotificationIcon(type: AppNotificationType) {
    switch (type) {
        case 'deadline_approaching':
            return <Clock className="h-4 w-4 text-amber-500" />;
        case 'task_status_changed':
            return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
        case 'task_assigned':
        case 'project_assigned':
            return <UserPlus className="h-4 w-4 text-emerald-500" />;
        case 'task_at_risk':
            return <AlertTriangle className="h-4 w-4 text-orange-500" />;
        case 'project_overdue':
            return <AlertCircle className="h-4 w-4 text-red-500" />;
        case 'user_overloaded':
            return <AlertTriangle className="h-4 w-4 text-red-600" />;
        case 'project_capacity_at_risk':
            return <TrendingDown className="h-4 w-4 text-red-500" />;
        case 'project_high_workload':
            return <Flame className="h-4 w-4 text-orange-500" />;
        case 'task_hours_exceeded':
            return <Clock className="h-4 w-4 text-red-500" />;
        case 'project_status_changed':
            return <RefreshCw className="h-4 w-4 text-blue-500" />;
        case 'password_reset_requested':
            return <KeyRound className="h-4 w-4 text-amber-600" />;
        default:
            return <Bell className="h-4 w-4 text-gray-400" />;
    }
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'práve teraz';
    if (diffMin < 60) return `pred ${diffMin} min`;
    if (diffHours < 24) return `pred ${diffHours} h`;
    if (diffDays === 1) return 'včera';
    return `pred ${diffDays} dňami`;
}

function NotificationItem({
    notification,
    onRead,
    onDelete,
}: {
    notification: AppNotification;
    onRead: () => void;
    onDelete: () => void;
}) {
    const isUnread = notification.read_at === null;

    const handleClick = () => {
        onRead();
        if (notification.data.url) {
            router.visit(notification.data.url);
        }
    };

    return (
        <div
            className={`group flex w-full items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
                isUnread ? 'bg-primary/5' : ''
            }`}
        >
            <button
                onClick={handleClick}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
            >
                <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.data.type)}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                        {notification.data.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
                        {notification.data.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                        {formatRelativeTime(notification.created_at)}
                    </p>
                </div>
            </button>
            <div className="mt-1 flex shrink-0 items-center gap-1">
                {isUnread && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-200"
                >
                    <X className="h-3 w-3 text-gray-400" />
                </button>
            </div>
        </div>
    );
}

export function NotificationBell() {
    const { props } = usePage<SharedData>();
    const [open, setOpen] = useState(false);
    const { data, isLoading } = useNotifications();
    const { mutate: markAsRead } = useMarkAsRead();
    const { mutate: markAllAsRead } = useMarkAllAsRead();
    const { mutate: deleteNotification } = useDeleteNotification();
    const { mutate: deleteAll } = useDeleteAllNotifications();

    const notifications = data?.data ?? [];
    const unreadCount =
        data?.unread_count ?? props.notifications?.unread_count ?? 0;

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-80 p-0"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">
                        Notifikácie
                    </span>
                    <div className="flex items-center gap-3">
                        {notifications.length > 0 && (
                            <button
                                onClick={() => {
                                    markAllAsRead();
                                    deleteAll();
                                }}
                                className="text-xs text-primary hover:text-primary/80"
                            >
                                Označiť všetky ako prečítané
                            </button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <span className="text-sm text-gray-400">
                                Načítavam...
                            </span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10">
                            <Bell className="h-8 w-8 text-gray-200" />
                            <span className="text-sm text-gray-400">
                                Žiadne notifikácie
                            </span>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((n) => (
                                <NotificationItem
                                    key={n.id}
                                    notification={n}
                                    onRead={() => {
                                        if (n.read_at === null)
                                            markAsRead(n.id);
                                        setOpen(false);
                                    }}
                                    onDelete={() => deleteNotification(n.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
