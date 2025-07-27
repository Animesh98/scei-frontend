import axios from 'axios';
import { API_BASE_URL, AZURE_FUNCTIONS_KEY } from '@/constants';
import { useAuthStore } from '@/store/auth-store';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token, domain, and Azure Functions key
api.interceptors.request.use((config) => {
  const { token, user } = useAuthStore.getState();
  
  // Add Azure Functions key for API access
  config.headers['x-functions-key'] = AZURE_FUNCTIONS_KEY;
  
  if (token) {
    config.headers.Authorization = token;
  }
  
  // Always set domain from authenticated user, not from request
  if (user?.domain) {
    config.headers.domain = user.domain;
  }
  
  // Debug logging for assessment generation requests
  if (config.url?.includes('/assessments/generate')) {
    console.log('API Request Headers:', {
      'x-functions-key': config.headers['x-functions-key'],
      'domain': config.headers.domain,
      'Authorization': config.headers.Authorization ? 'Present' : 'Missing',
      'Content-Type': config.headers['Content-Type']
    });
    console.log('API Request URL:', config.baseURL + config.url);
    console.log('API Request Data:', config.data);
  }
  
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect to login if the 401 is from the login endpoint itself
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;