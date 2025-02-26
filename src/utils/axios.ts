import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://epsilora-backend.vercel.app';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 180000, // 3 minutes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
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

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
          refreshToken: localStorage.getItem('refreshToken')
        });

        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
