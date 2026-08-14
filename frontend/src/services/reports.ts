import { api } from './api';

export const reportsService = {
  getDashboardSummary: async () => {
    const response = await api.get('/reports/dashboard/summary/');
    return response.data;
  },

  getMonthlyFinancial: async () => {
    const response = await api.get('/reports/financial/monthly/');
    return response.data;
  },

  getArtistPerformance: async (artistId: number) => {
    const response = await api.get(`/reports/artist/${artistId}/performance/`);
    return response.data;
  },

  getSubscriptionRevenue: async () => {
    const response = await api.get('/reports/revenue/subscription/');
    return response.data;
  },
};