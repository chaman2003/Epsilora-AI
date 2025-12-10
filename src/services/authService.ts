import axiosInstance from '../config/axios';
import { AuthResponse, ApiResponse } from '../types/api';

/**
 * Auth Service - Handles all authentication API calls
 */
class AuthService {
  /**
   * Register a new user
   */
  async signup(name: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await axiosInstance.post('/api/auth/signup', {
      name,
      email,
      password
    });
    return response.data;
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await axiosInstance.post('/api/auth/login', {
      email,
      password
    });
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getMe() {
    const response = await axiosInstance.get('/api/auth/me');
    return response.data;
  }

  /**
   * Verify token validity
   */
  async verifyToken(token: string): Promise<ApiResponse<{ valid: boolean }>> {
    const response = await axiosInstance.post('/api/auth/verify-token', {
      token
    });
    return response.data;
  }

  /**
   * Logout user (client-side)
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
}

export default new AuthService();
