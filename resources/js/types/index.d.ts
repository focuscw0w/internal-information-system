import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export type NotificationPriority = 'high' | 'medium' | 'low';
export type AtRiskReason = 'overdue' | 'stale' | 'no_progress';
export type AppNotificationType =
    | 'deadline_approaching'
    | 'task_status_changed'
    | 'task_assigned'
    | 'task_at_risk'
    | 'project_overdue';

export interface AppNotificationData {
    type: AppNotificationType;
    title: string;
    message: string;
    project_id: number;
    project_name: string;
    task_id?: number | null;
    task_title?: string | null;
    url: string;
    priority: NotificationPriority;
    days_remaining?: number;
    old_status?: string;
    new_status?: string;
    reason?: AtRiskReason;
}

export interface AppNotification {
    id: string;
    type: string;
    data: AppNotificationData;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    notifications: { unread_count: number };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
