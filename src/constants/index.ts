/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    SIGNUP: '/api/auth/signup',
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',
    VERIFY_TOKEN: '/api/auth/verify-token',
  },
  // Courses
  COURSES: {
    LIST: '/api/courses',
    CREATE: '/api/courses',
    DELETE: (id: string) => `/api/courses/${id}`,
    EXTRACT: '/api/extract-course',
  },
  // Quiz
  QUIZ: {
    GENERATE: '/api/quiz/generate',
    HISTORY: '/api/quiz/history',
    SAVE_RESULT: '/api/quiz/save-result',
    STATS: '/api/quiz/stats',
    HISTORY_BY_USER: (userId: string) => `/api/quiz/history/${userId}`,
  },
  // Chat
  CHAT: {
    LIST: '/api/chat-history',
    GET: (chatId: string) => `/api/chat-history/${chatId}`,
    CREATE: '/api/chat-history',
    UPDATE: (chatId: string) => `/api/chat-history/${chatId}`,
    DELETE: (chatId: string) => `/api/chat-history/${chatId}`,
    DELETE_ALL: '/api/chat-history/all',
  },
  // Dashboard
  DASHBOARD: '/api/dashboard',
};

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  QUIZ_DATA: 'quiz_data',
  THEME: 'theme',
};

/**
 * Quiz Difficulties
 */
export const QUIZ_DIFFICULTIES = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
} as const;

/**
 * User Roles
 */
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export default {
  API_ENDPOINTS,
  STORAGE_KEYS,
  QUIZ_DIFFICULTIES,
  USER_ROLES,
};
