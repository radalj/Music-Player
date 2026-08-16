import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor برای اضافه کردن توکن به هدرها
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const parsed = JSON.parse(user);
          if (parsed.access) {
            config.headers.Authorization = `Bearer ${parsed.access}`;
          }
        } catch (e) {}
      }
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (config.data !== undefined && config.data !== null) {
      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor برای مدیریت خطاها
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const hadToken = Boolean(error.config?.headers?.Authorization);
    const onLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');
    if (status === 401 && hadToken && typeof window !== 'undefined' && !onLoginPage) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);