import { api } from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  display_name: string;
  role?: string;
  portfolio?: string;
}

export const authService = {
  login: async (data: LoginData) => {
    const response = await api.post('/users/login/', data);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/users/register/', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile/');
    return response.data;
  },

  updateProfile: async (data: FormData) => {
    const response = await api.patch('/users/profile/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/users/settings/');
    return response.data;
  },

  updateSettings: async (data: any) => {
    const response = await api.patch('/users/settings/', data);
    return response.data;
  },
};