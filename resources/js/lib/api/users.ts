import { User } from '@/types';
import axios from 'axios';

export const usersApi = {
    getAll: async (): Promise<User[]> => {
        const { data } = await axios.get('/users/options');
        return data;
    },
};
