import courseService from '../services/courseService.js';
import { asyncHandler, sendSuccess, sendError, sendValidationError } from '../utils/responseHandler.js';

/**
 * Course Controller - Handles course routes
 */
class CourseController {
  /**
   * Get all courses for the authenticated user
   * @route GET /api/courses
   */
  getCourses = asyncHandler(async (req, res) => {
    try {
      const courses = await courseService.getCourses(req.user.id);
      return sendSuccess(res, { courses }, 'Courses retrieved successfully');
    } catch (error) {
      console.error('Error fetching courses:', error);
      return sendError(res, 'Error fetching courses', 500, error);
    }
  });

  /**
   * Create a new course
   * @route POST /api/courses
   */
  createCourse = asyncHandler(async (req, res) => {
    try {
      const course = await courseService.createCourse(req.body, req.user.id);
      return sendSuccess(res, { course }, 'Course created successfully', 201);
    } catch (error) {
      console.error('Error creating course:', error);
      return sendError(res, 'Error creating course', 500, error);
    }
  });

  /**
   * Delete a course
   * @route DELETE /api/courses/:id
   */
  deleteCourse = asyncHandler(async (req, res) => {
    try {
      await courseService.deleteCourse(req.params.id, req.user.id);
      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting course:', error);
      return sendError(res, 'Error deleting course', 500, error);
    }
  });

  /**
   * Extract course information from URL
   * @route POST /api/extract-course
   */
  extractCourse = asyncHandler(async (req, res) => {
    const { courseUrl, hoursPerWeek } = req.body;

    if (!courseUrl) {
      return sendValidationError(res, ['Course URL is required']);
    }

    try {
      const courseInfo = await courseService.extractCourseInfo(courseUrl, hoursPerWeek);
      return sendSuccess(res, { courseInfo }, 'Course information extracted successfully');
    } catch (error) {
      console.error('Error extracting course:', error);
      return sendError(res, error.message || 'Error extracting course information', 500, error);
    }
  });
}

export default new CourseController();
