import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Course from '../models/Course.js';
import { generateContent } from '../utils/gemini.js';
import config from '../config/config.js';

/**
 * Quiz Service - Handles quiz business logic
 */
class QuizService {
  /**
   * Generate quiz questions using AI
   * @param {Object} params - Quiz parameters
   * @returns {Promise<Array>} Generated questions
   */
  async generateQuiz({ courseId, numberOfQuestions, difficulty, timePerQuestion }) {
    const maxQuestions = 30;
    const actualNumberOfQuestions = Math.min(numberOfQuestions, maxQuestions);

    if (!config.geminiApiKey) {
      throw new Error('API key not configured');
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Create optimized prompt
    const promptText = `Create ${actualNumberOfQuestions} multiple choice questions about "${course.name}" at ${difficulty} difficulty. 
Format as JSON array: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A"}]. 
Make questions challenging and diverse. Output ONLY valid JSON, no markdown.`;

    console.log(`Generating ${actualNumberOfQuestions} questions at ${difficulty} difficulty`);

    const generatedText = await generateContent(promptText, config.geminiModel);

    // Clean and parse response
    let cleanedText = generatedText
      .replace(/```(?:json)?\s*/gi, '')
      .replace(/```\s*/g, '')
      // Smart/curly quotes -> straight quotes
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      // Remove control characters (keep tab/newline/CR for now)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Fix invalid JSON escape sequences (e.g. \' is not valid JSON)
      .replace(/\\'/g, "'")
      // Collapse whitespace
      .replace(/[\n\r\t]+/g, ' ')
      .trim();

    // Extract the JSON array
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    // Fix trailing commas before ] or } (common AI mistake)
    cleanedText = cleanedText
      .replace(/,\s*]/g, ']')
      .replace(/,\s*}/g, '}');

    let questions;
    try {
      questions = JSON.parse(cleanedText);
      if (!Array.isArray(questions)) {
        throw new Error('Not a valid array of questions');
      }
    } catch (parseError) {
      console.error('JSON Parsing Error:', parseError);
      console.error('Cleaned text snippet:', cleanedText.slice(0, 300));
      throw new Error('Failed to parse generated quiz data');
    }

    // Format and validate questions
    const formattedQuestions = questions
      .slice(0, actualNumberOfQuestions)
      .map((q, index) => {
        const options = Array.isArray(q.options) ? 
          q.options.map(opt => opt.trim()) : 
          ["Option A", "Option B", "Option C", "Option D"];

        let correctAnswer = null;
        if (q.correctAnswer) {
          const answerStr = String(q.correctAnswer).trim().toUpperCase();
          const match = answerStr.match(/^([A-D])/);
          correctAnswer = match ? match[1] : (answerStr === 'A' || answerStr === 'B' || answerStr === 'C' || answerStr === 'D' ? answerStr : 'A');
        } else {
          correctAnswer = 'A';
        }

        return {
          id: index + 1,
          question: (q.question || `Question ${index + 1}`).trim(),
          options: options.slice(0, 4),
          correctAnswer: correctAnswer,
          timePerQuestion: timePerQuestion || 60
        };
      });

    return formattedQuestions;
  }

  /**
   * Get quiz history for user
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} Quiz history
   */
  async getQuizHistory(userId, limit = 10) {
    const quizHistory = await Quiz.find({ userId })
      .populate('courseId', 'name')
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    return quizHistory.map(quiz => ({
      id: quiz._id.toString(),
      courseId: quiz.courseId._id.toString(),
      courseName: quiz.courseId.name,
      score: quiz.score,
      totalQuestions: quiz.totalQuestions,
      difficulty: quiz.difficulty,
      date: quiz.date,
      timeSpent: quiz.timeSpent,
      percentageScore: (quiz.score / quiz.totalQuestions) * 100
    }));
  }

  /**
   * Save quiz result
   * @param {Object} quizData - Quiz result data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Saved quiz with updated history
   */
  async saveQuizResult(quizData, userId) {
    const {
      courseId,
      questions,
      score,
      totalQuestions,
      difficulty,
      timeSpent,
      timePerQuestion
    } = quizData;

    // Validate required fields
    if (!courseId || !questions || score === undefined || !totalQuestions || !difficulty) {
      throw new Error('Missing required fields');
    }

    // Create new quiz
    const quiz = new Quiz({
      userId,
      courseId,
      score,
      totalQuestions,
      difficulty,
      questions: questions.map(q => ({
        question: q.question,
        correctAnswer: q.correctAnswer,
        userAnswer: q.answer,
        isCorrect: q.correct,
        timeSpent: timePerQuestion
      })),
      timeSpent,
      date: new Date()
    });

    await quiz.save();

    // Get updated quiz history
    const updatedHistory = await this.getQuizHistory(userId);

    return {
      quiz: updatedHistory[0],
      history: updatedHistory
    };
  }

  /**
   * Get quiz statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Quiz statistics
   */
  async getQuizStats(userId) {
    const quizzes = await Quiz.find({ userId }).lean();

    if (quizzes.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        totalQuestions: 0,
        totalCorrect: 0
      };
    }

    const totalQuizzes = quizzes.length;
    const totalCorrect = quizzes.reduce((sum, quiz) => sum + quiz.score, 0);
    const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz.totalQuestions, 0);
    const averageScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    return {
      totalQuizzes,
      averageScore: Math.round(averageScore),
      totalQuestions,
      totalCorrect
    };
  }
}

export default new QuizService();
