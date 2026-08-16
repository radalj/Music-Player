// src/services/users.ts
import { api } from './api';

export const userService = {
  getUsers: async (params?: any) => {
    const response = await api.get('/users/', { params });
    return response.data;
  },

  followUser: async (userId: number) => {
    const response = await api.post(`/users/${userId}/follow/`);
    return response.data;
  },

  unfollowUser: async (userId: number) => {
    const response = await api.delete(`/users/${userId}/follow/`);
    return response.data;
  },

  getUserProfile: async (userId: number) => {
    const response = await api.get(`/users/${userId}/`);
    return response.data;
  },
};