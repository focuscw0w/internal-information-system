import { router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowRightLeft,
    Bell,
    Clock,
    UserPlus,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMarkAllAsRead, useMarkAsRead, useNotifications } from '@/hooks/use-notifications';
import { type AppNotification, type AppNotificationType, type SharedData } from '@/types';

function getNotificationIcon(type: AppNotificationType) {
    switch (type) {
        case 'deadline_approaching':
            return <Clock className="h-4 w-4 text-amber-500" />;
        case 'task_status_changed':
            return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
        case 'task_assigned':
            return <UserPlus className="h-4 w-4 text-emerald-500" />;
        case 'task_at_risk':
            return <AlertTriangle className="h-4 w-4 text-orange-500" />;
        case 'project_overdue':
            return <AlertCircle className="h-4 w-4 text-red-500" />;
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

function NotificationItem({ notification, onRead }: { notification: AppNotification; onRead: () => void }) {
    const isUnread = notification.read_at === null;

    const handleClick = () => {
        onRead();
        if (notification.data.url) {
            router.visit(notification.data.url);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                isUnread ? 'bg-blue-50/40' : ''
            }`}
        >
            <div className="mt-0.5 shrink-0">{getNotificationIcon(notification.data.type)}</div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{notification.data.title}</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed line-clamp-2">{notification.data.message}</p>
                <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(notification.created_at)}</p>
            </div>
            {isUnread && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
        </button>
    );
}

export function NotificationBell() {
    const { props } = usePage<SharedData>();
    const unreadCount = props.notifications?.unread_count ?? 0;

    const [open, setOpen] = useState(false);
    const { data, isLoading } = useNotifications();
    const { mutate: markAsRead } = useMarkAsRead();
    const { mutate: markAllAsRead } = useMarkAllAsRead();

    const notifications = data?.data ?? [];

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">Notifikácie</span>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllAsRead()}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            Označiť všetky ako prečítané
                        </button>
                    )}
                </div>

                {/* List */}
                <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <span className="text-sm text-gray-400">Načítavam...</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <Bell className="h-8 w-8 text-gray-200" />
                            <span className="text-sm text-gray-400">Žiadne notifikácie</span>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((n) => (
                                <NotificationItem
                                    key={n.id}
                                    notification={n}
                                    onRead={() => {
                                        if (n.read_at === null) markAsRead(n.id);
                                        setOpen(false);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
