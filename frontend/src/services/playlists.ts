import { api } from './api';

export const playlistService = {
  getPlaylists: async () => {
    const response = await api.get('/playlists/');
    return response.data;
  },

  createPlaylist: async (data: { name: string }) => {
    const response = await api.post('/playlists/', data);
    return response.data;
  },

  updatePlaylist: async (id: number, data: { name: string }) => {
    const response = await api.patch(`/playlists/${id}/`, data);
    return response.data;
  },

  deletePlaylist: async (id: number) => {
    const response = await api.delete(`/playlists/${id}/`);
    return response.data;
  },

  addTrack: async (playlistId: number, trackId: number) => {
    const response = await api.post(`/playlists/${playlistId}/add-track/`, {
      track_id: trackId,
    });
    return response.data;
  },

  removeTrack: async (playlistId: number, trackId: number) => {
    const response = await api.delete(`/playlists/${playlistId}/remove-track/${trackId}/`);
    return response.data;
  },
};