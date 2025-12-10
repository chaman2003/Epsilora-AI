/**
 * API Response Types
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CourseData {
  _id?: string;
  title: string;
  description: string;
  url?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizGenerationParams {
  courseId: string;
  courseName: string;
  topic: string;
  difficulty: string;
  questionCount: number;
}

export interface QuizResultData {
  courseId: string;
  courseName: string;
  score: number;
  totalQuestions: number;
  difficulty: string;
  timeSpent: number;
}

export interface ChatHistoryData {
  _id?: string;
  title: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardData {
  quizAttempts: unknown[];
  courseProgress: unknown[];
  aiUsage: unknown;
  achievements: unknown[];
  stats: {
    totalCourses: number;
    totalQuizzes: number;
    averageScore: number;
  };
}
