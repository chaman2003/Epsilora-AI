import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard data including quiz attempts, course progress, AI usage, and achievements
 * @access  Private
 */
router.get('/', authenticateToken, dashboardController.getDashboardData);

export default router;
