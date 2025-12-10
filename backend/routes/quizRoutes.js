import express from 'express';
import quizController from '../controllers/quizController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/quiz/generate
 * @desc    Generate quiz questions using AI
 * @access  Private
 */
router.post('/generate', authenticateToken, quizController.generateQuiz);

/**
 * @route   GET /api/quiz/history
 * @desc    Get quiz history for authenticated user
 * @access  Private
 */
router.get('/history', authenticateToken, quizController.getQuizHistory);

/**
 * @route   POST /api/quiz/save-result
 * @desc    Save quiz result
 * @access  Private
 */
router.post('/save-result', authenticateToken, quizController.saveQuizResult);

/**
 * @route   GET /api/quiz/stats
 * @desc    Get quiz statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, quizController.getQuizStats);

/**
 * @route   GET /api/quiz/history/:userId
 * @desc    Get quiz history by user ID
 * @access  Private
 */
router.get('/history/:userId', authenticateToken, quizController.getQuizHistoryByUserId);

export default router;
