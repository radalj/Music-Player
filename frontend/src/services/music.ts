import { api } from './api';

export const musicService = {
  getTracks: async (params?: any) => {
    const response = await api.get('/music/tracks/', { params });
    return response.data;
  },

  getTrack: async (id: number) => {
    const response = await api.get(`/music/tracks/${id}/`);
    return response.data;
  },

  createTrack: async (data: FormData) => {
    const response = await api.post('/music/tracks/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateTrack: async (id: number, data: FormData) => {
    const response = await api.patch(`/music/tracks/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteTrack: async (id: number) => {
    const response = await api.delete(`/music/tracks/${id}/`);
    return response.data;
  },

  getAlbums: async (params?: any) => {
    const response = await api.get('/music/albums/', { params });
    return response.data;
  },

  createAlbum: async (data: any) => {
    const response = await api.post('/music/albums/', data);
    return response.data;
  },
};