
import axios from 'axios';
import { toast } from 'sonner';
import { auth } from '../../services/firebase';

// Default to relative path since we are serving API from the same origin
const API_BASE_URL = '/';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem('access_token');
    
    // Try to get a fresh token from Firebase if user is logged in
    if (auth.currentUser) {
      try {
        token = await auth.currentUser.getIdToken(true);
        localStorage.setItem('access_token', token);
      } catch (e) {
        console.warn('Failed to refresh Firebase token', e);
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 401 Handling (Token Expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // In a real scenario with Refresh Tokens, we would attempt refresh here.
      // For now, we logout on 401 to ensure security.
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.location.href = '/';
    }

    // Global Error UI Feedback
    const errorMessage = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    
    // Don't toast on 401 as we redirect, unless it's a login failure
    if (error.response?.status !== 401 || originalRequest.url.includes('/login')) {
       toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);
