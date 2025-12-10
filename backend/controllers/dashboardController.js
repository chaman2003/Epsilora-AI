import dashboardService from '../services/dashboardService.js';
import { asyncHandler, sendSuccess, sendError } from '../utils/responseHandler.js';

/**
 * Dashboard Controller - Handles dashboard routes
 */
class DashboardController {
  /**
   * Get dashboard data
   * @route GET /api/dashboard
   */
  getDashboardData = asyncHandler(async (req, res) => {
    try {
      const dashboardData = await dashboardService.getDashboardData(req.user.id);
      return sendSuccess(res, dashboardData, 'Dashboard data retrieved successfully');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return sendError(res, 'Failed to fetch dashboard data', 500, error);
    }
  });
}

export default new DashboardController();
