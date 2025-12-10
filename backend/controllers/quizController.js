import quizService from '../services/quizService.js';
import { asyncHandler, sendSuccess, sendError, sendValidationError } from '../utils/responseHandler.js';

/**
 * Quiz Controller - Handles quiz routes
 */
class QuizController {
  /**
   * Generate quiz questions
   * @route POST /api/generate-quiz
   */
  generateQuiz = asyncHandler(async (req, res) => {
    console.log('Quiz generation started:', new Date().toISOString());
    
    const { courseId, numberOfQuestions, difficulty, timePerQuestion } = req.body;

    if (!courseId || !numberOfQuestions || !difficulty) {
      return sendValidationError(res, ['Missing required parameters: courseId, numberOfQuestions, difficulty']);
    }

    try {
      const questions = await quizService.generateQuiz({
        courseId,
        numberOfQuestions,
        difficulty,
        timePerQuestion
      });

      console.log(`Generated ${questions.length} questions successfully`);
      return sendSuccess(res, { questions }, 'Quiz generated successfully');
    } catch (error) {
      console.error('Error generating quiz:', error);
      if (error.message === 'Course not found') {
        return sendError(res, error.message, 404);
      }
      return sendError(res, error.message || 'Error generating quiz', 500, error);
    }
  });

  /**
   * Get quiz history for user
   * @route GET /api/quiz/history
   */
  getQuizHistory = asyncHandler(async (req, res) => {
    console.log('Fetching quiz history for user:', req.user.id);

    try {
      const history = await quizService.getQuizHistory(req.user.id);
      console.log('Found quiz history entries:', history.length);
      return sendSuccess(res, { history }, 'Quiz history retrieved successfully');
    } catch (error) {
      console.error('Error fetching quiz history:', error);
      return sendError(res, 'Error fetching quiz history', 500, error);
    }
  });

  /**
   * Save quiz result
   * @route POST /api/quiz/save-result
   */
  saveQuizResult = asyncHandler(async (req, res) => {
    try {
      const result = await quizService.saveQuizResult(req.body, req.user.id);
      return sendSuccess(res, result, 'Quiz saved successfully');
    } catch (error) {
      console.error('Error saving quiz:', error);
      if (error.message === 'Missing required fields') {
        return sendValidationError(res, [error.message]);
      }
      return sendError(res, 'Error saving quiz', 500, error);
    }
  });

  /**
   * Get quiz history by user ID (alternate route)
   * @route GET /api/quiz-history/:userId
   */
  getQuizHistoryByUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Verify the requesting user matches the userId or has proper permissions
    if (req.user.id !== userId) {
      return sendError(res, 'Unauthorized access', 403);
    }

    try {
      const history = await quizService.getQuizHistory(userId);
      return sendSuccess(res, { history }, 'Quiz history retrieved successfully');
    } catch (error) {
      console.error('Error fetching quiz history:', error);
      return sendError(res, 'Error fetching quiz history', 500, error);
    }
  });

  /**
   * Get quiz statistics
   * @route GET /api/quiz/stats
   */
  getQuizStats = asyncHandler(async (req, res) => {
    try {
      const stats = await quizService.getQuizStats(req.user.id);
      return sendSuccess(res, { stats }, 'Quiz statistics retrieved successfully');
    } catch (error) {
      console.error('Error fetching quiz stats:', error);
      return sendError(res, 'Error fetching quiz statistics', 500, error);
    }
  });
}

export default new QuizController();
