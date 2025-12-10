import express from 'express';
import courseController from '../controllers/courseController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/courses
 * @desc    Get all courses for authenticated user
 * @access  Private
 */
router.get('/', authenticateToken, courseController.getCourses);

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private
 */
router.post('/', authenticateToken, courseController.createCourse);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete a course
 * @access  Private
 */
router.delete('/:id', authenticateToken, courseController.deleteCourse);

/**
 * @route   POST /api/extract-course
 * @desc    Extract course information from URL using AI
 * @access  Private
 */
router.post('/extract-course', authenticateToken, courseController.extractCourse);

export default router;
