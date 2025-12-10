import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://epsilora-backend.vercel.app';

// Create axios instance with improved configuration
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds is more reasonable for API requests
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now()
    };
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second
const RETRY_STATUS_CODES = [408, 500, 502, 503, 504, 429];

// Add response interceptor with better error handling and retry logic
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { config, response = {} } = error;
    
    // Skip retry for POST methods involving authentication and specific endpoints
    const skipRetryEndpoints = ['/api/auth/login', '/api/auth/signup'];
    
    // Only retry if the request is retryable
    const isRetryable = config && 
                        !config._isRetry && 
                        !skipRetryEndpoints.some(endpoint => config.url?.includes(endpoint)) &&
                        (!response || RETRY_STATUS_CODES.includes(response.status));
    
    if (isRetryable) {
      config._isRetry = true;
      config._retryCount = config._retryCount || 0;
      
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        console.log(`Retrying request (${config._retryCount}/${MAX_RETRIES}): ${config.url}`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config._retryCount));
        return axiosInstance(config);
      }
    }
    
    // Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error);
      return Promise.reject(new Error('Request timed out. Please try again later.'));
    }
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', error.response.status, error.response.data);
      
      // Special handling for different status codes
      if (error.response.status === 504) {
        return Promise.reject(new Error('The server is taking too long to respond. Please try again later.'));
      }
      
      return Promise.reject(error.response.data || error);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return Promise.reject(new Error('No response from server. Please check your connection.'));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      return Promise.reject(error);
    }
  }
);

export default axiosInstance;
