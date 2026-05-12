import { InertiaLinkProps } from '@inertiajs/react';

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
    icon?: string | null;
    isActive?: boolean;
}

export type NotificationPriority = 'high' | 'medium' | 'low';
export type AtRiskReason = 'overdue' | 'stale' | 'no_progress';
export type AppNotificationType =
    | 'deadline_approaching'
    | 'task_status_changed'
    | 'task_assigned'
    | 'project_assigned'
    | 'task_at_risk'
    | 'project_overdue'
    | 'user_overloaded'
    | 'project_capacity_at_risk'
    | 'project_high_workload'
    | 'task_hours_exceeded'
    | 'project_status_changed'
    | 'password_reset_requested';

export interface AppNotificationData {
    type: AppNotificationType;
    title: string;
    message: string;
    project_id: number | null;
    project_name: string | null;
    task_id?: number | null;
    task_title?: string | null;
    url: string;
    priority: NotificationPriority;
    days_remaining?: number;
    old_status?: string;
    new_status?: string;
    reason?: AtRiskReason;
    utilization?: number;
    remaining_hours?: number;
    confidence?: number;
    workload?: string;
    estimated_hours?: number;
    actual_hours?: number;
}

export interface AppNotification {
    id: string;
    type: string;
    data: AppNotificationData;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface FlashWarningBlocked {
    type: 'blocked_by';
    message: string;
    blocked_by: { id: number; title: string; status: string }[];
    attempted_status: string;
}

export type FlashWarning = FlashWarningBlocked | string | null;

export interface FlashData {
    success?: string | null;
    error?: string | null;
    warning?: FlashWarning;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    current_user_permissions?: string[];
    sidebarOpen: boolean;
    notifications: { unread_count: number };
    flash?: FlashData;
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
