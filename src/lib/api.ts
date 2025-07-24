import axios from 'axios';
import { API_BASE_URL } from '@/constants';
import { useAuthStore } from '@/store/auth-store';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token and domain
api.interceptors.request.use((config) => {
  const { token, user } = useAuthStore.getState();
  
  if (token) {
    config.headers.Authorization = token;
  }
  
  if (user?.domain) {
    config.headers.domain = user.domain;
  }
  
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;