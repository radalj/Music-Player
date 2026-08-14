import { api } from './api';

export const subscriptionService = {
  getPlans: async () => {
    const response = await api.get('/subscriptions/plans/');
    return response.data;
  },

  getMySubscription: async () => {
    const response = await api.get('/subscriptions/my-subscription/');
    return response.data;
  },

  purchase: async (plan_id: number, duration_months: number) => {
    const response = await api.post('/subscriptions/purchase/', {
      plan_id,
      duration_months,
    });
    return response.data;
  },
};