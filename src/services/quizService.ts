import axiosInstance from '../config/axios';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Quiz Service - Handles all quiz API calls
 */
class QuizService {
  /**
   * Generate quiz questions
   */
  async generateQuiz(courseId: string, numberOfQuestions: number, difficulty: string, timePerQuestion: number = 60): Promise<any> {
    const response = await axiosInstance.post('/api/quiz/generate', {
      courseId,
      numberOfQuestions,
      difficulty,
      timePerQuestion
    });
    return response.data;
  }

  /**
   * Get quiz history
   */
  async getQuizHistory() {
    const response = await axiosInstance.get('/api/quiz/history');
    return response.data;
  }

  /**
   * Save quiz result
   */
  async saveQuizResult(quizData: any): Promise<any> {
    const response = await axiosInstance.post('/api/quiz/save-result', quizData);
    return response.data;
  }

  /**
   * Get quiz statistics
   */
  async getQuizStats() {
    const response = await axiosInstance.get('/api/quiz/stats');
    return response.data;
  }

  /**
   * Get quiz history by user ID
   */
  async getQuizHistoryByUserId(userId: string): Promise<any> {
    const response = await axiosInstance.get(`/api/quiz/history/${userId}`);
    return response.data;
  }
}

export default new QuizService();
