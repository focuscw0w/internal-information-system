import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';

export const useUsers = () => {
    return useQuery({
        queryKey: ['users'], 
        queryFn: usersApi.getAll,
        staleTime: 5 * 60 * 1000, 
        gcTime: 10 * 60 * 1000, 
    });
};