import axiosInstance from '../config/axios';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Dashboard Service - Handles dashboard data API calls
 */
class DashboardService {
  /**
   * Get dashboard data
   */
  async getDashboardData() {
    const response = await axiosInstance.get('/api/dashboard');
    return response.data;
  }
}

export default new DashboardService();
