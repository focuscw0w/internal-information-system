import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';

export const useNotifications = () => {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationsApi.getAll(),
        staleTime: 30 * 1000,
        refetchInterval: 30 * 1000,
    });
};

export const useMarkAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => notificationsApi.markAsRead(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useMarkAllAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => notificationsApi.markAllAsRead(),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};
