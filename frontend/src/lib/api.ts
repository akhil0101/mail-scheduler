import axios from 'axios';

// Use environment variable in production, proxy in development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  getGoogleAuthUrl: () => api.get('/auth/google/url'),
  me: () => api.get('/auth/me'),
};

// Subscribers API
export const subscribersApi = {
  getAll: () => api.get('/subscribers'),
  getStats: () => api.get('/subscribers/stats'),
  create: (data: { email: string; name: string }) =>
    api.post('/subscribers', data),
  update: (id: string, data: { email?: string; name?: string }) =>
    api.put(`/subscribers/${id}`, data),
  toggle: (id: string) => api.patch(`/subscribers/${id}/toggle`),
  delete: (id: string) => api.delete(`/subscribers/${id}`),
  import: (subscribers: { email: string; name: string }[]) =>
    api.post('/subscribers/import', { subscribers }),
};

// Templates API
export const templatesApi = {
  getAll: () => api.get('/templates'),
  get: (id: string) => api.get(`/templates/${id}`),
  create: (data: { name: string; subject: string; body: string }) =>
    api.post('/templates', data),
  update: (id: string, data: { name?: string; subject?: string; body?: string }) =>
    api.put(`/templates/${id}`, data),
  toggle: (id: string) => api.patch(`/templates/${id}/toggle`),
  delete: (id: string) => api.delete(`/templates/${id}`),
  preview: (id: string) => api.post(`/templates/${id}/preview`),
};

// Schedule API
export const scheduleApi = {
  get: () => api.get('/schedule'),
  update: (data: { cronTime: string; timezone: string; isActive: boolean }) =>
    api.put('/schedule', data),
  send: (templateId: string) => api.post('/schedule/send', { templateId }),
  getLogs: (limit?: number) => api.get('/schedule/logs', { params: { limit } }),
  getStats: () => api.get('/schedule/stats'),
};

// Gmail API
export const gmailApi = {
  getAuthUrl: () => api.get('/gmail/auth-url'),
  test: () => api.get('/gmail/test'),
};

export default api;
