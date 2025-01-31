export interface User {
  id: string;
  name: string;
  email: string;
  preferences?: {
    darkMode: boolean;
    notifications: boolean;
  };
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizAttempt {
  id: string;
  courseId: string;
  courseName: string;
  score: number;
  totalQuestions: number;
  difficulty: string;
  date: string;
  timeSpent: number;
  timePerQuestion: number;
  percentageScore: number;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  courseId: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'Pending' | 'Ongoing' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  courseId: string;
  aiGenerated?: boolean;
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  progress: number;
  quizzesTaken: number;
  averageScore: number;
  lastAccessed: string;
  milestones: Milestone[];
  tasks: Task[];
}

export interface AIUsageStats {
  tokensUsed: number;
  conversationCount: number;
  lastUsed: string;
  recommendations?: Array<{
    id: string;
    type: 'Task' | 'Study' | 'Quiz';
    content: string;
    priority: 'Low' | 'Medium' | 'High';
    generated: string;
  }>;
}

export interface PerformanceMetrics {
  dailyStudyTime: Array<{
    date: string;
    minutes: number;
  }>;
  quizScores: Array<{
    date: string;
    score: number;
    courseId: string;
  }>;
  taskCompletionRate: number;
  milestoneProgress: number;
  strengths: string[];
  areasForImprovement: string[];
}

export interface Notification {
  id: string;
  type: 'Deadline' | 'Achievement' | 'Recommendation' | 'System';
  title: string;
  message: string;
  date: string;
  read: boolean;
  priority: 'Low' | 'Medium' | 'High';
  actionUrl?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
}

export interface DashboardData {
  user: User;
  recentQuizzes: QuizAttempt[];
  courseProgress: CourseProgress[];
  aiUsage: AIUsageStats;
  performanceMetrics: PerformanceMetrics;
  notifications: Notification[];
  achievements: Achievement[];
  upcomingMilestones: Milestone[];
  pendingTasks: Task[];
}

export interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface ProgressData {
  week: string;
  score: number;
}

export interface ImageGeneration {
  id: number;
  user_id: number;
  image_key: string;
  prompt: string;
  generated_at: string;
  model: string;
  hf_lora: string;
  prediction_log: any;
  prediction_id: string;
  prediction_status: string;
  replicate_image_url: string;
  is_deleted: boolean;
  is_favorite: boolean;
}

export interface Wallet {
  wallet_id: number;
  user_id: number;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  transaction_id: number;
  wallet_id: number;
  amount: number;
  transaction_type: 'credit' | 'debit';
  description: string;
  created_at: string;
}

export interface Course {
  _id: string;
  name: string;
  description?: string;
  provider: string;
  duration: string;
  pace: string;
  objectives: string[];
  deadline: string;
  milestones: { name: string; deadline: string; }[];
  prerequisites: string[];
  mainSkills: string[];
}

export interface QuizDetails {
  numberOfQuestions: number;
  difficulty: string;
  timePerQuestion: number;
}

export interface UserStats {
  totalQuizzes: number;
  averageScore: number;
  quizHistory: QuizAttempt[];
  coursesEnrolled: number;
  aiTokensUsed: number;
  lastActive: string;
}