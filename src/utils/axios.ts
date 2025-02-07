import axios from 'axios';

// Create axios instance with default config
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://epsilora-backend.vercel.app',
  timeout: 30000, // Increased timeout to 30 seconds
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ECONNABORTED') {
      // Handle timeout error
      console.error('Request timed out:', error.config?.url);
      throw new Error('Request timed out. Please try again.');
    }
    
    if (error.response?.status === 401) {
      // Clear token on unauthorized
      localStorage.removeItem('token');
      
      // Only redirect if we're not already on the login page and not trying to log in
      const isLoginPage = window.location.pathname.includes('/login');
      const isLoginRequest = error.config?.url?.includes('/login');
      
      if (!isLoginPage && !isLoginRequest) {
        window.location.href = '/login';
      }
    }
    
    // Network errors
    if (error.message === 'Network Error') {
      console.error('Network error:', error);
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }

    // Handle CORS errors
    if (error.message?.includes('CORS')) {
      console.error('CORS error:', error);
      throw new Error('Unable to connect to server due to CORS policy.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
