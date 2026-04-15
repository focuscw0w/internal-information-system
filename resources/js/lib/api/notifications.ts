import { AppNotification } from '@/types';
import axios from 'axios';

interface NotificationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface NotificationsResponse {
    data: AppNotification[];
    unread_count: number;
    meta: NotificationMeta;
}

export const notificationsApi = {
    getAll: async (page = 1): Promise<NotificationsResponse> => {
        const { data } = await axios.get<NotificationsResponse>(`/notifications?page=${page}`);
        return data;
    },

    markAsRead: async (id: string): Promise<void> => {
        await axios.patch(`/notifications/${id}/read`);
    },

    markAllAsRead: async (): Promise<{ marked: number }> => {
        const { data } = await axios.post<{ marked: number }>('/notifications/mark-all-read');
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await axios.delete(`/notifications/${id}`);
    },

    deleteAll: async (): Promise<{ deleted: number }> => {
        const { data } = await axios.delete<{ deleted: number }>('/notifications');
        return data;
    },
};
