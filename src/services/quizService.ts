import axiosInstance from '../config/axios';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Quiz Service - Handles all quiz API calls
 * All responses are unwrapped from the nested { success, message, data: {...} } structure
 */
class QuizService {
  /**
   * Helper to extract data from nested response
   */
  private extractData(response: any): any {
    const data = response.data;
    return data.data || data;
  }

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
    return this.extractData(response);
  }

  /**
   * Get quiz history
   */
  async getQuizHistory() {
    const response = await axiosInstance.get('/api/quiz/history');
    return this.extractData(response);
  }

  /**
   * Save quiz result
   */
  async saveQuizResult(quizData: any): Promise<any> {
    const response = await axiosInstance.post('/api/quiz/save-result', quizData);
    return this.extractData(response);
  }

  /**
   * Get quiz statistics
   */
  async getQuizStats() {
    const response = await axiosInstance.get('/api/quiz/stats');
    return this.extractData(response);
  }

  /**
   * Get quiz history by user ID
   */
  async getQuizHistoryByUserId(userId: string): Promise<any> {
    const response = await axiosInstance.get(`/api/quiz/history/${userId}`);
    return this.extractData(response);
  }
}

export default new QuizService();
