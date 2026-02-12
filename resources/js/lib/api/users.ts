import axios from 'axios';
import { User } from '@/types';

export const usersApi = {
    getAll: async (): Promise<User[]> => {
        const { data } = await axios.get('/users');
        return data;
    },
};
