import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  ClipboardList,
  ChevronLeft, 
  ChevronRight,
  Check,
  Target,
  Award,
  Calendar,
  History
} from 'lucide-react';
import axiosInstance from '../utils/axios';
import { Course, QuizAttempt } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useQuiz } from '../context/QuizContext';
import toast from 'react-hot-toast';
import QuizLimitNotice from '../components/QuizLimitNotice';
import QuizGenerationError from '../components/QuizGenerationError';
import QuizGenerationOverlay from '../components/quiz/QuizGenerationOverlay';
import { format } from 'date-fns';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { themeConfig } from '../config/theme';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler
);

// Replace the NodeJS namespace with a more TypeScript-friendly approach
declare global {
  // Use a type alias instead of namespace
  type Timeout = ReturnType<typeof setTimeout>;
}

interface QuizDetails {
  numberOfQuestions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timePerQuestion: number;
}
interface QuestionState {
  userAnswer: string | null;
  timeExpired: boolean;
  viewed: boolean;
  timeLeft: number;
  isCorrect?: boolean; // Add this property
}
interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}
interface CourseStats {
  correct: number;
  wrong: number;
  name: string;
}

// Add a comprehensive answer matching utility near the top of the file
/**
 * Determines if a selected answer matches the correct answer with multiple matching strategies
 * Returns detailed information about the match process for debugging
 */
const determineAnswerCorrectness = (selectedAnswer: string, correctAnswer: string, options: any[]): { 
  isCorrect: boolean; 
  matchMethod: string;
  details: string;
} => {
  // Clean up answers
  const selectedClean = selectedAnswer?.trim?.() || '';
  const correctClean = correctAnswer?.trim?.() || '';
  
  // Convert everything to uppercase for case-insensitive comparison
  const selectedUpper = selectedClean.toUpperCase();
  const correctUpper = correctClean.toUpperCase();
  
  // Initialize result
  let result = {
    isCorrect: false,
    matchMethod: 'none',
    details: `Selected: "${selectedClean}", Correct: "${correctClean}"`
  };
  
  // STRATEGY 1: Direct letter match (when the selected answer is just a letter like "A", "B", etc.)
  if (selectedUpper.length === 1 && "ABCD".includes(selectedUpper)) {
    // If correct answer is also a single letter
    if (correctUpper.length === 1 && "ABCD".includes(correctUpper)) {
      result.isCorrect = selectedUpper === correctUpper;
      result.matchMethod = 'direct-letter';
      result.details += ` | Direct letter match: ${result.isCorrect}`;
      if (result.isCorrect) return result;
    }
    
    // If correct answer starts with the letter (like "A.", "A)", "A -")
    if (correctUpper.startsWith(selectedUpper) && !(/[A-Z]/.test(correctUpper.charAt(1)))) {
      result.isCorrect = true;
      result.matchMethod = 'letter-prefix';
      result.details += ` | Letter prefix match`;
      return result;
    }
    
    // Map the selected letter to its index (A=0, B=1, etc.)
    const letterIndex = selectedUpper.charCodeAt(0) - 65;
    
    // If it's a valid option index (0-3 for A-D)
    if (letterIndex >= 0 && letterIndex < options.length) {
      // Get the text content of the selected option
      const optionText = typeof options[letterIndex] === 'object' && options[letterIndex] !== null && 'text' in options[letterIndex]
        ? (options[letterIndex] as {text: string}).text
        : String(options[letterIndex]);
      
      // Clean up option text
      const cleanOptionText = optionText
        .replace(/^[a-dA-D][\)\.]\s*/g, '')
        .replace(/^[a-dA-D]\s+/g, '')
        .trim()
        .toUpperCase();
      
      // If the correct answer matches the option text
      if (cleanOptionText === correctUpper || correctUpper.includes(cleanOptionText)) {
        result.isCorrect = true;
        result.matchMethod = 'option-text-match';
        result.details += ` | Option text match: "${cleanOptionText}"`;
        return result;
      }
      
      // Check if the option text contains the correct answer or vice versa
      if (cleanOptionText.includes(correctUpper) || correctUpper.includes(cleanOptionText)) {
        result.isCorrect = true;
        result.matchMethod = 'partial-option-text';
        result.details += ` | Partial text match: "${cleanOptionText}" contains/within "${correctUpper}"`;
        return result;
      }
    }
  }
  
  // STRATEGY 2: For special keywords
  const specialKeywords = ["SET", "X", "IS", "TUPLE", "LIST", "DICTIONARY", "DEF"];
  
  // Remove quotes from correct answer if present
  const cleanedCorrect = correctUpper.replace(/['"]/g, '');
  
  if (specialKeywords.includes(cleanedCorrect)) {
    // Find the corresponding option text for this answer
    if (selectedUpper.length === 1 && "ABCD".includes(selectedUpper)) {
      const letterIndex = selectedUpper.charCodeAt(0) - 65;
      if (letterIndex >= 0 && letterIndex < options.length) {
        const optionText = typeof options[letterIndex] === 'object' && options[letterIndex] !== null && 'text' in options[letterIndex]
          ? (options[letterIndex] as {text: string}).text
          : String(options[letterIndex]);
        
        const cleanOptionText = optionText
          .replace(/^[a-dA-D][\)\.]\s*/g, '')
          .replace(/^[a-dA-D]\s+/g, '')
          .trim()
          .toUpperCase();
        
        if (cleanOptionText === cleanedCorrect) {
          result.isCorrect = true;
          result.matchMethod = 'keyword-match';
          result.details += ` | Keyword match: "${cleanOptionText}" matches "${cleanedCorrect}"`;
          return result;
        }
      }
    }
  }
  
  // STRATEGY 3: Direct string comparison (fallback)
  if (selectedUpper === correctUpper) {
    result.isCorrect = true;
    result.matchMethod = 'exact-match';
    result.details += ` | Exact string match`;
    return result;
  }
  
  return result;
};

const Quiz: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { setQuizData } = useQuiz();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionStates, setQuestionStates] = useState<QuestionState[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizDetails, setQuizDetails] = useState<QuizDetails>({
    numberOfQuestions: 5,
    difficulty: 'Medium',
    timePerQuestion: 30
  });
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [formattedQuizHistory, setFormattedQuizHistory] = useState<QuizAttempt[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [historyFetched, setHistoryFetched] = useState(false);
  const [quizStats, setQuizStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    latestScore: 0
  });
  // Chart data preparation
  const [correctVsWrongData, setCorrectVsWrongData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
    }[];
  }>({
    labels: [],
    datasets: []
  });
  const [successRateData, setSuccessRateData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
    }[]
  }>({
    labels: [],
    datasets: []
  });
  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        animation: {
          duration: 2000,
        }
      }
    },
    animation: {
      duration: 2000,
    }
  };
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      },
      tooltip: {
        animation: {
          duration: 2000,
        }
      }
    },
    animation: {
      duration: 2000,
    }
  };
  // Add a ref to track if we're currently transitioning
  const isTransitioning = React.useRef(false);

  // State for quiz history filters
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'difficulty'>('date');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const navigate = useNavigate();
  // Add state for modal control
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Add a new state for the maximum question count
  const [maxQuestionCount, setMaxQuestionCount] = useState(5);
  // Add state to track generation errors
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Move fetchQuizHistory declaration to the top of the component, before any useEffects
  const fetchQuizHistory = React.useCallback(async () => {
    if (historyFetched && quizHistory.length > 0) return;
    if (!user?._id) {
      console.log('User ID not available, skipping quiz history fetch');
      return;
    }
    try {
      setIsLoadingHistory(true);
      console.log('Fetching quiz history...');
      const response = await axiosInstance.get(`/api/quiz-history/${user._id}`);
      console.log('Quiz history raw response:', response.data);
      const history = response.data.history.map((quiz: any) => ({
        id: quiz.id || quiz._id,
        courseId: quiz.courseId,
        courseName: 'Loading...', // Set to loading initially
        score: quiz.score,
        totalQuestions: quiz.totalQuestions,
        difficulty: quiz.difficulty,
        timeSpent: quiz.timeSpent,
        date: new Date(quiz.createdAt || quiz.date),
        questions: quiz.questions || []
      }));
      setQuizHistory(history);
      setHistoryFetched(true);

      // Update quiz stats if available
      if (response.data.stats) {
        setQuizStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching quiz history:', error);
      toast.error('Failed to fetch quiz history. Please try again.');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [historyFetched, quizHistory.length, user?._id]);

  // Open history modal function
  const openHistoryModal = () => {
    setIsHistoryModalOpen(true);
  };

  // Close history modal function
  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
  };

  // Move other functions here that might be referenced in useEffects
  const fetchCourses = async () => {
    try {
      // Check if we already have courses to prevent redundant API calls
      if (courses.length > 0) {
        return; // Skip fetch if we already have courses
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found, skipping courses fetch');
        return;
      }
      
      const response = await axiosInstance.get('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000 // Set a reasonable timeout
      });
      
      console.log('Raw courses response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        setCourses(response.data);
        
        // Once we have courses, we can update the quiz history with course names
        if (quizHistory.length > 0) {
          const updatedHistory = quizHistory.map((quiz) => {
            const course = response.data.find((c: { _id: string }) => c._id === quiz.courseId);
            return {
              ...quiz,
              courseName: course ? course.name : 'Unknown Course'
            };
          });
          
          setFormattedQuizHistory(updatedHistory);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Don't show error toast as it may be annoying on repeated failures
      // Instead, silently retry with backoff or use cached data
      
      // Set empty courses array to prevent repeated fetch attempts
      if (courses.length === 0) {
        setCourses([]);
      }
    }
  };

  // Memoize the fetch function to prevent unnecessary re-creation
  const memoizedFetchCourses = useCallback(fetchCourses, [courses.length, quizHistory.length]);

  // Now that all function declarations are above, we can safely use them in useEffects
  useEffect(() => {
    let isMounted = true;
    
    const initializeData = async () => {
      if (isAuthenticated && !isLoading && user?._id) {
        console.log('Authentication status:', isAuthenticated);
        
        // Only proceed if component is still mounted
        if (isMounted) {
          await memoizedFetchCourses();
          // Don't call fetchQuizStatsFromAPI() since the endpoint doesn't exist
          await fetchQuizHistory(); // Safe to call now that it's defined above
        }
      } else {
        setError('Please log in to access your courses');
      }
    };
    
    initializeData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isLoading, user?._id, memoizedFetchCourses, fetchQuizHistory]);

  useEffect(() => {
    if (courses.length > 0 && quizHistory.length > 0) {
      const updatedHistory = quizHistory.map(quiz => {
        const course = courses.find(c => c._id === quiz.courseId);
        const successRate = (quiz.score && quiz.totalQuestions) ? Math.round((quiz.score / quiz.totalQuestions) * 100) : 0;
        return {
          ...quiz,
          courseName: course?.name || quiz.courseName || 'Deleted Course',
          successRate
        };
      });
      setFormattedQuizHistory(updatedHistory);
    }
  }, [courses, quizHistory]);
  useEffect(() => {
    if (quizHistory && courses && courses.length > 0) {
      try {
        // Prepare data for Correct vs Wrong Answers chart
        const courseStats: { [key: string]: CourseStats } = courses.reduce((acc, course) => {
          const courseQuizzes = quizHistory.filter(q => q.courseId === course._id) || [];
          const correct = courseQuizzes.reduce((sum, q) => sum + (q.score || 0), 0);
          const total = courseQuizzes.reduce((sum, q) => sum + (q.totalQuestions || 0), 0);
          acc[course._id] = {
            correct,
            wrong: total - correct,
            name: course.name.split(' ').slice(0, 3).join(' ')
          };
          return acc;
        }, {});
        setCorrectVsWrongData({
          labels: Object.values(courseStats).map((s: CourseStats) => s.name),
          datasets: [
            {
              label: 'Correct Answers',
              data: Object.values(courseStats).map((s: CourseStats) => s.correct),
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
            {
              label: 'Wrong Answers',
              data: Object.values(courseStats).map((s: CourseStats) => s.wrong),
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }
          ]
        });
        // Prepare data for Success Rate chart
        const successRates = courses.map(course => {
          const courseQuizzes = quizHistory.filter(q => q.courseId === course._id) || [];
          if (courseQuizzes.length === 0) return { name: course.name, rate: 0 };
          const totalCorrect = courseQuizzes.reduce((sum, q) => sum + (q.score || 0), 0);
          const totalQuestions = courseQuizzes.reduce((sum, q) => sum + (q.totalQuestions || 0), 0);
          return {
            name: course.name.split(' ').slice(0, 3).join(' '),
            rate: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0
          };
        }).filter(rate => rate.rate > 0);

        setSuccessRateData({
          labels: successRates.map(r => r.name),
          datasets: [{
            label: 'Success Rate (%)',
            data: successRates.map(r => r.rate),
            backgroundColor: [
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
              'rgba(255, 159, 64, 0.5)',
            ],
          }]
        });
      } catch (error) {
        console.error('Error preparing chart data:', error);
      }
    }
  }, [quizHistory, courses]);

const calculateAverageScore = (history: any[]) => {
  if (history.length === 0) return 0;
  
  const scores = history.map(quiz => 
    (quiz.score / quiz.totalQuestions) * 100
  );
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(average);
};

  const calculateQuizStats = async () => {
  try {
      if (!formattedQuizHistory || formattedQuizHistory.length === 0) {
      setQuizStats({
        totalQuizzes: 0,
        averageScore: 0,
        latestScore: 0
      });
      return;
    }

    // Sort by date to get the latest quiz
    const sortedHistory = [...formattedQuizHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const latestQuiz = sortedHistory[0];
    const latestScore = latestQuiz ? Math.round((latestQuiz.score / latestQuiz.totalQuestions) * 100) : 0;
    const averageScore = calculateAverageScore(formattedQuizHistory);

    setQuizStats({
      totalQuizzes: formattedQuizHistory.length,
      averageScore: averageScore,
      latestScore: latestScore
    });

  } catch (error) {
    console.error('Error calculating quiz statistics:', error);
  }
};

  // Add a new useEffect to calculate quiz stats locally after quiz history is loaded
useEffect(() => {
    if (formattedQuizHistory && formattedQuizHistory.length > 0) {
      calculateQuizStats();
  }
  }, [formattedQuizHistory]);

// Add a retry function with fewer questions
const retryWithFewerQuestions = () => {
  setQuizDetails(prev => ({
    ...prev,
    numberOfQuestions: maxQuestionCount
  }));
  setGenerationError(null);
  generateQuiz();
};

const generateQuiz = async () => {
  if (!selectedCourse) {
    toast.error('Please select a course first');
    return;
  }

  if (!isAuthenticated) {
    toast.error('Please log in to generate a quiz');
    navigate('/login', { state: { from: '/quiz' } });
    return;
  }

  // Clear any previous generation errors
  setGenerationError(null);
  setLoading(true);
  let retryCount = 0;
  const maxRetries = 2;

  const attemptQuizGeneration = async (): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Sending quiz generation request with params:', {
        courseId: selectedCourse,
        numberOfQuestions: quizDetails.numberOfQuestions,
        difficulty: quizDetails.difficulty,
        timePerQuestion: quizDetails.timePerQuestion
      });

      // Set timeout to 15 seconds (reduced from 180000)
      const response = await axiosInstance.post('/api/generate-quiz', {
        courseId: selectedCourse,
        numberOfQuestions: quizDetails.numberOfQuestions,
        difficulty: quizDetails.difficulty,
        timePerQuestion: quizDetails.timePerQuestion
      }, {
        timeout: 15000, // 15 seconds timeout
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Quiz generation API response status:', response.status);
      return response;
    } catch (error: any) {
      console.error('Error in attemptQuizGeneration:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Handle timeout errors specifically
        if (error.response.status === 504 || 
            (error.response.status === 500 && 
             error.response.data?.message === 'Quiz generation timed out')) {
          
          // Extract max questions count if available
          if (error.response.data?.maxQuestions) {
            setMaxQuestionCount(error.response.data.maxQuestions);
          }
          
          // Create a more informative error message
          const errorMsg = `Quiz generation timed out. Please try with ${maxQuestionCount} or fewer questions.`;
          setGenerationError(errorMsg);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      // Only retry for certain errors, not timeouts
      if (error.response?.status === 500 && 
          !error.response.data?.message?.includes('timed out') && 
          retryCount < maxRetries) {
        retryCount++;
        console.log(`Retry attempt ${retryCount} of ${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
        return attemptQuizGeneration();
      }
      throw error;
    }
  };

  try {
    const response = await attemptQuizGeneration();

    // Log the entire response to help with debugging
    console.log('Quiz generation response:', response);
    
    // More detailed validation of the response
    if (!response) {
      throw new Error('No response received from server');
    }
    
    if (!response.data) {
      throw new Error('Response missing data object');
    }

    // Check if response.data is the questions array directly
    let questionsArray;
    if (Array.isArray(response.data)) {
      console.log('Response data is directly an array of questions');
      questionsArray = response.data;
    } else if (response.data.questions && Array.isArray(response.data.questions)) {
      console.log('Response data contains a questions property with an array');
      questionsArray = response.data.questions;
    } else {
      console.error('Invalid response structure:', response.data);
      throw new Error('Unable to find questions array in response');
    }
    
    if (questionsArray.length === 0) {
      console.error('Questions array is empty:', questionsArray);
      throw new Error('Questions array must not be empty');
    }

    setQuestions(questionsArray);

    const initialQuestionStates = questionsArray.map(() => ({
      userAnswer: null,
      timeExpired: false,
      viewed: false,
      timeLeft: quizDetails.timePerQuestion
    }));

    setQuestionStates(initialQuestionStates);
    setCurrentQuestion(0);
    setScore(0);
    setQuizStarted(true);
    setStartTime(new Date());
    setLoading(false);

  } catch (error: any) {
    console.error('Error generating quiz:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    
    if (error.response?.status === 401) {
      toast.error('Session expired. Please log in again');
      navigate('/login', { state: { from: '/quiz' } });
    } else if (error.message?.includes('timed out')) {
      // Set the error message for the error component instead of using toast
      const errorMsg = `Quiz generation timed out. Please try with ${maxQuestionCount} or fewer questions.`;
      setGenerationError(errorMsg);
    } else {
      // Set general error message
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate quiz';
      setGenerationError(errorMessage);
    }
    
    setLoading(false);
  }
};

  useEffect(() => {
    if (questions && questions.length > 0) {
      const initialStates = questions.map(() => ({
        userAnswer: null,
        timeExpired: false,
        viewed: false,
        timeLeft: quizDetails.timePerQuestion
      }));
      setQuestionStates(initialStates);
    }
  }, [questions, quizDetails.timePerQuestion]);
  const updateQuestionState = React.useCallback((index: number, updates: Partial<QuestionState>) => {
    setQuestionStates(prev => {
      const newStates = [...prev];
      newStates[index] = { ...newStates[index], ...updates };
      return newStates;
    });
  }, []);

  // Now let's modify the handleAnswerSelect function to use our new matcher
  const handleAnswerSelect = React.useCallback((answer: string) => {
    if (currentQuestion >= questions?.length || questionStates[currentQuestion]?.viewed) {
      return;
    }
    
    setSelectedAnswer(answer);
    
    // Get the current question and its correct answer
    const currentQuestionObj = questions[currentQuestion];
    const correctAnswer = currentQuestionObj?.correctAnswer || '';
    const options = currentQuestionObj?.options || [];
    
    // Use our comprehensive matcher with full debugging
    const matchResult = determineAnswerCorrectness(answer, correctAnswer, options);
    
    // Clear, detailed logging
    console.log(`------ ANSWER SELECTION ------`);
    console.log(`Question: "${currentQuestionObj?.question}"`);
    console.log(`Selected answer: "${answer}"`);
    console.log(`Correct answer: "${correctAnswer}"`);
    console.log(`Match result: ${matchResult.isCorrect ? 'CORRECT ✓' : 'INCORRECT ✗'}`);
    console.log(`Match method: ${matchResult.matchMethod}`);
    console.log(`Details: ${matchResult.details}`);
    console.log(`-------------------------------`);
    
    // Update score if answer is correct
    if (matchResult.isCorrect) {
      setScore(prev => prev + 1);
    }
    
    // Mark question as viewed and store user's answer
    updateQuestionState(currentQuestion, {
      userAnswer: answer,
      viewed: true,
      // IMPORTANT: Store whether the answer was correct in the questionState
      // This ensures consistency when checking later
      isCorrect: matchResult.isCorrect
    });
  }, [currentQuestion, questions, questionStates, updateQuestionState]);

  useEffect(() => {
    let timer: Timeout;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer as unknown as number);
            setTimerActive(false);
            updateQuestionState(currentQuestion, {
              timeExpired: true,
              viewed: true
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer as unknown as number);
  }, [timerActive, timeLeft, currentQuestion, questions?.length, quizDetails.timePerQuestion, updateQuestionState]);

  const calculateFinalScore = React.useCallback(() => {
    let totalCorrect = 0;
    if (!questions) return 0;
    
    // Use the stored isCorrect values for consistency
    questionStates.forEach((state) => {
      if (state.isCorrect) {
        totalCorrect++;
      }
    });
    
    return totalCorrect;
  }, [questions, questionStates]);

  const getResultMessage = React.useCallback((score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return "Excellent! You've mastered this topic! 🌟";
    if (percentage >= 80) return "Great job! You have a strong understanding! 💪";
    if (percentage >= 70) return "Good work! Keep practicing to improve further. 👍";
    if (percentage >= 60) return "Not bad! A bit more study will help. 📚";
    return "You might want to review this topic and try again. 💡";
  }, []);

  const fetchQuizHistoryCallback = React.useCallback(fetchQuizHistory, [historyFetched, quizHistory.length]);
  const saveQuizResult = React.useCallback(async (finalScore: number) => {
    if (!user?._id || !selectedCourse || !questions || !questionStates) {
      console.error('Quiz data not found. Please ensure all data is available before saving.');
      return;
    }
    console.log('Before saving quiz result:', { 
      userId: user?._id, 
      selectedCourse, 
      questions, 
      questionStates, 
      finalScore, 
      quizDetails, 
      startTime, 
      courses 
    });
    try {
      const courseObj = courses.find(c => c._id === selectedCourse);
      if (!courseObj) {
        console.error('Course not found');
        return;
      }
      
      // Check if startTime is null and set a fallback
      if (!startTime) {
        console.warn('Quiz startTime was not set. Using current time as fallback.');
        setStartTime(new Date());
        // Wait for state update to complete
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      const totalTimeSpent = new Date().getTime() - (startTime?.getTime() || new Date().getTime());
      const quizData = {
        userId: user?._id,
        courseId: selectedCourse,
        questions: questions.map((q, index) => {
          // Get option text and clean it if it's a string
          const cleanedOptions = q.options.map((opt, i) => {
            let optionText = typeof opt === 'object' && opt !== null && 'text' in opt 
              ? (opt as {text: string}).text 
              : String(opt);
            
            // Remove any existing letter prefixes like "a)", "b)", etc.
            optionText = optionText.replace(/^[a-dA-D]\)[\s]*/g, '');
            
            return {
              text: optionText,
              label: String.fromCharCode(65 + i) // 'A', 'B', 'C', etc.
            };
          });
          
          return {
            question: q.question,
            options: cleanedOptions,
            userAnswer: questionStates[index]?.userAnswer || null,
            correctAnswer: q.correctAnswer,
            isCorrect: questionStates[index]?.isCorrect || false
          };
        }),
        score: finalScore,
        totalQuestions: questions.length,
        courseName: courseObj.name,
        difficulty: quizDetails.difficulty,
        timeSpent: totalTimeSpent,
        timePerQuestion: quizDetails.timePerQuestion,
        correctAnswers: finalScore,
        date: new Date().toISOString()
      };
      console.log('Quiz Data Payload:', quizData);
      await axiosInstance.post('/api/quiz/save-result', quizData);
      await fetchQuizHistoryCallback();
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }
  }, [selectedCourse, courses, questions, questionStates, quizDetails, startTime, user?._id, fetchQuizHistoryCallback]);

  const handleQuizComplete = React.useCallback(async () => {
    if (!questions || !questionStates) return;
    
    setTimerActive(false);
    const finalScore = calculateFinalScore();
    
    // If a save function exists
    if (saveQuizResult) {
    saveQuizResult(finalScore).then(() => {
        console.log('Quiz saved successfully');
        setShowResult(true);
    }).catch(error => {
        console.error('Error saving quiz:', error);
        toast.error('Error saving quiz result');
        setShowResult(true);
    });
    } else {
      setShowResult(true);
    }
  }, [questions, questionStates, calculateFinalScore, saveQuizResult]);

  const handleGetAIHelp = React.useCallback(() => {
    console.log("handleGetAIHelp called - preparing quiz data for AI assist");
    const courseObj = courses.find(course => course._id === selectedCourse);
    
    if (!courseObj) {
      console.error("Could not find course object for selectedCourse:", selectedCourse);
      toast.error("Error: Could not find course information");
      return;
    }
    
    if (!questions || questions.length === 0) {
      console.error("No questions available for AI help");
      toast.error("Error: No quiz questions available");
      return;
    }
    
    // Create a copy of the quiz data with proper structure for AI processing
    const quizData = {
      questions: questions.map((q, index) => {
        // Get user answer from question states
        const userAnswer = questionStates[index]?.userAnswer;
        const correctAnswer = q.correctAnswer;
        
        // Determine if answer is correct using case-insensitive comparison
        const isCorrect = userAnswer && correctAnswer 
          ? userAnswer.toUpperCase() === correctAnswer.toUpperCase()
          : false;
        
        console.log(`Question ${index + 1}: User answer=${userAnswer}, Correct answer=${correctAnswer}, isCorrect=${isCorrect}`);
        
        return {
          question: q.question,
          options: q.options.map((opt, optIndex) => {
            // Get option text and clean it if it's a string
            let optionText = typeof opt === 'object' && opt !== null && 'text' in opt 
              ? (opt as {text: string}).text 
              : String(opt);
            
            // Remove any existing letter prefixes like "a)", "b)", etc.
            optionText = optionText.replace(/^[a-dA-D]\)[\s]*/g, '').trim();
            
            return {
              text: optionText,
              label: String.fromCharCode(65 + optIndex)
            };
          }),
          correctAnswer: correctAnswer,
          userAnswer: userAnswer,
          isCorrect: isCorrect
        };
      }),
      score: score,
      totalQuestions: questions.length,
      courseName: courseObj.name,
      difficulty: quizDetails.difficulty,
      timestamp: new Date().toISOString(),
      id: `${courseObj.name}-${score}-${questions.length}-${Date.now()}`
    };
    
    // Check if this quiz has been processed already
    const processedQuizzes = JSON.parse(localStorage.getItem('processedQuizzes') || '[]');
    const quizDataId = quizData.id;
    
    // Clear any existing quiz data to prevent processing loops
    localStorage.removeItem('quizData');
    localStorage.removeItem('lastQuizData');
    
    console.log('Setting quiz data in context and localStorage:', quizData);
    
    // Store in both context and localStorage with different approaches to ensure it's saved
    setQuizData(quizData);
    
    // Store the quiz data and track it as processed
    try {
      const jsonString = JSON.stringify(quizData);
      localStorage.setItem('quizData', jsonString);
      localStorage.setItem('lastQuizData', jsonString);
      
      // Mark this quiz as processed
      if (!processedQuizzes.includes(quizDataId)) {
        processedQuizzes.push(quizDataId);
        localStorage.setItem('processedQuizzes', JSON.stringify(processedQuizzes));
      }
    } catch (error) {
      console.error('Error saving quiz data:', error);
    }
    
    // Ensure the data is properly set before navigating
    setTimeout(() => {
      // Double-check that data was saved
      const savedData = localStorage.getItem('quizData');
      if (!savedData) {
        console.error("Failed to save quiz data to localStorage");
        toast.error("Error saving quiz data. Please try again.");
        return;
      }
      
      console.log("Quiz data successfully saved, navigating to AI assist");
      // Navigate to AI assist
      navigate('/ai-assist', { replace: true });
    }, 100);
  }, [courses, selectedCourse, questions, questionStates, score, quizDetails.difficulty, setQuizData, navigate]);

  const handleNextQuestion = React.useCallback(() => {
    if (!questions || !questionStates) return;
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
        setTimeLeft(quizDetails.timePerQuestion);
        setTimerActive(true);
      }
  }, [currentQuestion, questions, quizDetails.timePerQuestion, setCurrentQuestion, setSelectedAnswer, setTimeLeft, setTimerActive]);
  const handlePreviousQuestion = React.useCallback(() => {
    if (isTransitioning.current) return;
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      const prevState = questionStates[currentQuestion - 1];
      setSelectedAnswer(prevState?.userAnswer || null);
      setShowResult(true);
      setTimerActive(false);
      setTimeLeft(0);
    }
  }, [currentQuestion, questionStates]);
  const handleFinishQuiz = React.useCallback(() => {
    setTimerActive(false);
    const finalScore = calculateFinalScore();
    
    // Prepare quiz data with complete question details
    const quizData = {
      questions: questions.map((q, index) => {
        const questionOptions = q.options.map((opt, optIndex) => {
          // Get option text and clean it if it's a string
          let optionText = typeof opt === 'object' && opt !== null && 'text' in opt 
            ? (opt as {text: string}).text 
            : String(opt);
          
          // Remove any existing letter prefixes like "a)", "b)", etc.
          optionText = optionText.replace(/^[a-dA-D]\)[\s]*/g, '');
          
          return {
            text: optionText,
            label: String.fromCharCode(65 + optIndex)
          };
        });
        
        // Use the stored isCorrect value directly from questionStates for consistency
        return {
          question: q.question,
          options: questionOptions,
          correctAnswer: q.correctAnswer,
          userAnswer: questionStates[index]?.userAnswer || null,
          isCorrect: questionStates[index]?.isCorrect || false
        };
      }),
      score: finalScore,
      totalQuestions: questions.length,
      courseName: courses.find(course => course._id === selectedCourse)?.name || '',
      difficulty: quizDetails.difficulty,
      timestamp: new Date().toISOString()
    };
    
    // Log the prepared data
    console.log("Prepared quiz data for results screen:", quizData);
    
    // Save quiz data for AI Assistant
    localStorage.setItem('quizData', JSON.stringify(quizData));
    
    // Save quiz result and navigate
    saveQuizResult(finalScore).then(() => {
      // Reset quiz state
      setQuizStarted(false);
      setQuestions([]);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      
      // Set quiz data in context
      setQuizData(quizData);

      // Navigate to results page
      navigate('/quiz-results', { 
        state: quizData,
        replace: true 
      });
    }).catch(error => {
      console.error('Error saving quiz result:', error);
      toast.error('There was an issue saving your results, but you can still view them.');
      
      // Prepare quizData for the results page
      const courseObj = courses.find(c => c._id === selectedCourse);
      if (courseObj) {
        const quizData = {
          score: finalScore,
          totalQuestions: questions.length,
          courseName: courseObj.name,
          difficulty: quizDetails.difficulty,
          questions: questions.map((q, index) => {
            // Create options array with proper label and text format
            const optionsWithLabels = q.options.map((opt, i) => {
              // Get option text and clean it if it's a string
              let optionText = typeof opt === 'object' && opt !== null && 'text' in opt 
                ? (opt as {text: string}).text 
                : String(opt);
              
              // Remove any existing letter prefixes like "a)", "b)", etc.
              optionText = optionText.replace(/^[a-dA-D][\)\.]\s*/g, '').replace(/^[a-dA-D]\s+/g, '');
              
              return {
                text: optionText,
                label: String.fromCharCode(65 + i)
              };
            });
            
            const userAnswer = questionStates[index]?.userAnswer;
            const isCorrect = userAnswer && q.correctAnswer 
              ? userAnswer.toUpperCase() === q.correctAnswer.toUpperCase()
              : false;
            
            return {
              question: q.question,
              options: optionsWithLabels,
              userAnswer: userAnswer,
              correctAnswer: q.correctAnswer,
              isCorrect: isCorrect
            };
          }),
          timestamp: new Date().toISOString()
        };
        
        // Always navigate to results page, even if saving failed
        setQuizData(quizData);
        navigate('/quiz-results', { 
          state: quizData,
          replace: true 
        });
      }
    });
  }, [questions, questionStates, courses, selectedCourse, quizDetails.difficulty, calculateFinalScore, saveQuizResult, navigate, setQuizData]);

  const renderQuestion = () => {
    if (!questions || questions.length === 0) return null;

    const currentState = questionStates[currentQuestion];
    if (!currentState) {
      return <div>Loading question...</div>;
    }
    
    return (
      <div className="space-y-6">
        {/* Course Information Header */}
        {courses.find(c => c._id === selectedCourse) && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl mb-4 shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{courses.find(c => c._id === selectedCourse)?.name}</h3>
                <p className="text-indigo-100 text-sm">{quizDetails.difficulty} Difficulty • {questions.length} Questions</p>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <span className="font-medium">Score: </span>
                <span className="font-bold">{calculateFinalScore()}/{questions.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Quiz Content - Landscape Layout */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Left side - Questions and Options */}
          <div className="w-full md:w-4/5 space-y-4 md:space-y-6">
            {/* Timer Display */}
            <div className="flex justify-center items-center mb-2 md:mb-4">
              <div className={`text-xl md:text-2xl font-bold rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center transition-colors duration-300
                ${!currentState.viewed && timeLeft <= 5 ? 'text-red-600 animate-pulse bg-red-100 dark:bg-red-900' : 
                  !currentState.viewed && timeLeft <= 10 ? 'text-orange-600 bg-orange-100 dark:bg-orange-900' :
                  'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800'}`}>
                {timeLeft}s
              </div>
            </div>

            {/* Question Content with enhanced styling */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 md:p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900 px-3 py-1 rounded-full text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Question {currentQuestion + 1} of {questions?.length}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium
                  ${quizDetails.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 
                    quizDetails.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                  {quizDetails.difficulty}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-6 p-3 md:p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                {questions[currentQuestion]?.question || 'Loading question...'}
              </div>

              {/* Options with enhanced styling */}
              <div className="space-y-3 md:space-y-4">
                {questions[currentQuestion]?.options?.map((option, index) => {
                  const letterOption = String.fromCharCode(65 + index); // A, B, C, D...
                  
                  // Ensure case-insensitive comparison for both selected and correct answers
                  const userAnswer = currentState.userAnswer;
                  const isSelected = userAnswer?.toUpperCase() === letterOption.toUpperCase();
                  
                  const correctAnswer = questions[currentQuestion]?.correctAnswer || '';
                  
                  // For determining correctness in the UI, use a staged approach:
                  // 1. If the current option is selected and we have an isCorrect value stored, use that
                  // 2. Otherwise, use the matcher to determine if this option is correct
                  let isCorrect = false;
                  
                  if (isSelected && currentState.isCorrect !== undefined) {
                    // For the selected answer, use the stored isCorrect value
                    isCorrect = currentState.isCorrect;
                    console.log(`Selected option ${letterOption} using stored correctness: ${isCorrect}`);
                  } else {
                    // For other options or as fallback, check with the matcher
                    const matchResult = determineAnswerCorrectness(
                      letterOption, 
                      correctAnswer,
                      questions[currentQuestion]?.options || []
                    );
                    isCorrect = matchResult.isCorrect;
                  }
                  
                  // Always show correct/incorrect indicators when the question has been viewed/answered
                  const showCorrect = currentState.viewed && isCorrect;
                  const showIncorrect = currentState.viewed && isSelected && !isCorrect;
                  
                  // Debug logging for troubleshooting
                  if (currentState.viewed) {
                    // Get cleaned text for debugging
                    const debugOptionText = typeof option === 'object' && option !== null && 'text' in option 
                      ? (option as {text: string}).text 
                      : String(option);
                    
                    const debugCleanedText = debugOptionText
                      .replace(/^[a-dA-D][).]\s*/g, '')
                      .replace(/^[a-dA-D]\s+/g, '')
                      .trim();
                    
                    console.log(`Option ${letterOption}: ${isCorrect ? 'CORRECT ✓' : 'INCORRECT ✗'}, selected: ${isSelected}, showCorrect: ${showCorrect}, text: "${debugCleanedText}"`);
                  }

                  // Check if option is an object with text property or just a string
                  const optionText = typeof option === 'object' && option !== null && 'text' in option 
                    ? (option as {text: string}).text 
                    : String(option);
                  
                  // Remove any leading option labels like "a)", "b)", etc. and handle "A.", "B." formats
                  const cleanedOptionText = optionText
                    .replace(/^[a-dA-D][\)\.]\s*/g, '')
                    .replace(/^[a-dA-D]\s+/g, '');

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(letterOption)}
                      disabled={currentState.viewed}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-200 flex items-center border
                        ${showCorrect
                          ? 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-300 dark:border-green-700 shadow-md'
                          : showIncorrect
                          ? 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-300 dark:border-red-700 shadow-md'
                          : isSelected
                          ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700 shadow-md'
                          : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/70 hover:shadow-md'
                        } ${currentState.viewed ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01] transform transition-transform'}`}
                    >
                      <span className={`flex items-center justify-center h-8 w-8 rounded-full mr-3
                        ${showCorrect
                          ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' 
                          : showIncorrect
                          ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
                          : isSelected
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                        {letterOption}
                      </span>
                      <span className="flex-grow font-medium">{cleanedOptionText}</span>
                      {showCorrect && <CheckCircle className="w-5 h-5 text-green-600 ml-2" />}
                      {showIncorrect && <XCircle className="w-5 h-5 text-red-600 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right side - Question Navigation */}
          <div className="w-full md:w-1/5 bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-base md:text-lg font-medium text-gray-800 dark:text-white mb-3 md:mb-4 text-center">Navigation</h3>
            
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-3 gap-1 md:gap-2 mb-4">
              {questions.map((_, index) => {
                const state = questionStates[index];
                if (!state) return null;
                
                let bgColor = 'bg-gray-200 dark:bg-gray-700';
                let textColor = 'text-gray-700 dark:text-gray-300';
                let borderColor = 'border-transparent';
                
                if (state.viewed) {
                  // Use the stored isCorrect value directly from state
                  const isCorrect = state.isCorrect || false;
                  
                  if (isCorrect) {
                    bgColor = 'bg-green-100 dark:bg-green-900/50';
                    textColor = 'text-green-800 dark:text-green-200';
                    borderColor = 'border-green-500';
                  } else {
                    bgColor = 'bg-red-100 dark:bg-red-900/50';
                    textColor = 'text-red-800 dark:text-red-200'; 
                    borderColor = 'border-red-500';
                  }
                } else if (currentQuestion === index) {
                  bgColor = 'bg-indigo-100 dark:bg-indigo-900/50';
                  textColor = 'text-indigo-800 dark:text-indigo-200';
                  borderColor = 'border-indigo-500';
                }
                
                return (
                  <button 
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`${bgColor} ${textColor} border-2 ${borderColor} w-full h-10 rounded-md flex items-center justify-center font-medium transition-all hover:scale-105 ${currentQuestion === index ? 'font-bold' : ''}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6">
              <div className="flex items-center space-x-2 text-sm mb-2">
                <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-500"></div>
                <span className="text-gray-600 dark:text-gray-300">Current</span>
              </div>
              <div className="flex items-center space-x-2 text-sm mb-2">
                <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/50 border-2 border-green-500"></div>
                <span className="text-gray-600 dark:text-gray-300">Correct</span>
              </div>
              <div className="flex items-center space-x-2 text-sm mb-2">
                <div className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/50 border-2 border-red-500"></div>
                <span className="text-gray-600 dark:text-gray-300">Incorrect</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <span className="text-gray-600 dark:text-gray-300">Unanswered</span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 space-y-3">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
                className={`w-full px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 
                  ${currentQuestion === 0
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Previous
              </button>

              {currentQuestion < questions?.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  disabled={!currentState.viewed}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200
                    ${!currentState.viewed
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleFinishQuiz}
                  disabled={!allQuestionsViewed(questionStates)}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200
                    ${!allQuestionsViewed(questionStates)
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                  Finish Quiz
                  <Check className="w-5 h-5 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const resetQuiz = React.useCallback(() => {
    setQuizStarted(false);
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer('');
    setTimeLeft(quizDetails.timePerQuestion);
    setTimerActive(false);
    setQuestionStates([]);
    setHistoryFetched(false); 
    setQuizHistory([]); 
    window.location.reload();
  }, [quizDetails.timePerQuestion]);

  const renderResultActions = React.useCallback(() => {
    return (
      <div className="flex justify-center space-x-4 mt-6">
        <button
          onClick={resetQuiz}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 ease-in-out"
        >
          Try Again
        </button>
        <button
          onClick={handleGetAIHelp}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 ease-in-out"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Get AI Help
        </button>
      </div>
    );
  }, [resetQuiz, handleGetAIHelp]);

  // Memoized values
  const uniqueCourses = useMemo(() => {
    if (!formattedQuizHistory) return [];
    const courses = new Set(formattedQuizHistory.map(quiz => quiz.courseName));
    return Array.from(courses);
  }, [formattedQuizHistory]);

  const filteredAndSortedHistory = useMemo(() => {
    if (!formattedQuizHistory) return [];
    const filteredHistory = formattedQuizHistory.filter(quiz => quiz.courseName !== 'Loading...');
    return filteredHistory
      .filter(quiz => {
        if (filterDifficulty !== 'all' && quiz.difficulty !== filterDifficulty) return false;
        if (filterCourse !== 'all' && quiz.courseName !== filterCourse) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'score') {
          return b.percentageScore - a.percentageScore;
        }
        // Sort by difficulty
        const difficultyOrder = { Easy: 0, Medium: 1, Hard: 2 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      });
  }, [formattedQuizHistory, filterDifficulty, filterCourse, sortBy]);

  // Update getLatestPerformance to a regular function since we need it to run on every render
  const getLatestPerformance = () => {
    if (!formattedQuizHistory || formattedQuizHistory.length === 0) return {
      courseName: 'N/A',
      score: 0,
      totalQuestions: 0,
      successRate: 0,
      performanceLevel: 'No Data',
      performanceColor: 'text-gray-500',
      timeTaken: 'N/A'
    };
    
  // Sort by date and get the most recent quiz
  const latestQuiz = [...formattedQuizHistory].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  // Calculate success rate
  const successRate = latestQuiz.totalQuestions > 0 
    ? Math.round((latestQuiz.score / latestQuiz.totalQuestions) * 100) 
    : 0;

  return {
    courseName: latestQuiz.courseName,
    score: latestQuiz.score,
    totalQuestions: latestQuiz.totalQuestions,
    successRate,
    performanceLevel: successRate >= 80 ? 'Excellent' 
      : successRate >= 60 ? 'Good'
      : successRate >= 40 ? 'Fair'
      : 'Needs Improvement',
    performanceColor: successRate >= 80 ? 'text-green-500 dark:text-green-400' 
      : successRate >= 60 ? 'text-blue-500 dark:text-blue-400'
      : successRate >= 40 ? 'text-yellow-500 dark:text-yellow-400'
      : 'text-red-500 dark:text-red-400',
    timeTaken: latestQuiz.timeSpent 
      ? `${Math.floor(latestQuiz.timeSpent / 60000)}m ${Math.floor((latestQuiz.timeSpent % 60000) / 1000)}s` 
      : 'N/A'
  };
};

  const [theme, setTheme] = useState('light');
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

// Update the Quiz component to show history inline again
const handleToggleHistory = () => {
  // Toggle history visibility
  setShowHistory(!showHistory);
  
  // If we're showing history and it hasn't been fetched yet, fetch it
  if (!showHistory && !historyFetched) {
    fetchQuizHistory();
  }
};

  if (!quizStarted && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 1.5 }}
        className={`min-h-screen bg-${themeConfig.colors.background.page.light} dark:bg-${themeConfig.colors.background.page.dark} py-4 backdrop-blur-md`}
      >
        <div className="container mx-auto px-2 mt-1">
          {/* Charts Section */}
          {!quizStarted && courses.length > 0 && quizHistory && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-2`}>
                <h2 className="text-lg font-semibold mb-1 text-center">Quizzes per Course</h2>
                <div className="h-[350px]">
                  <Pie data={successRateData} options={pieOptions} />
                </div>
              </div>
              
              <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-2`}>
                <h2 className="text-lg font-semibold mb-1 text-center">Success Rate by Course</h2>
                <div className="h-[350px]">
                  <Pie data={successRateData} options={pieOptions} />
                </div>
              </div>
              
              <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-2 md:col-span-2`}>
                <h2 className="text-lg font-semibold mb-1 text-center">Correct vs Wrong Answers</h2>
                <div className="h-[300px]">
                  <Bar data={correctVsWrongData} options={barOptions} />
                </div>
              </div>
            </div>
          )}
          {/* Gemini AI Quote */}
          <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-6 mb-6`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4v2m0 4v2m0 4v2M8 10h8v4H8z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">Gemini AI Says:</p>
                <blockquote className="text-gray-700 dark:text-gray-300 italic">
                  "Learning is not just about getting the right answers, but understanding why they're right. Each quiz is a step towards mastery, and every mistake is an opportunity to grow. Keep pushing your boundaries!"
                </blockquote>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  - Generated by Gemini AI for your learning journey
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Selection Section */}
          <div className="max-w-4xl mx-auto">
            <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-6`}>
              <h1 className="text-2xl font-bold mb-6 text-center">Select a Course for Quiz</h1>
              <div className="flex items-center justify-center">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full md:w-1/2 p-1 rounded-md border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  <option value="" disabled>Select a course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>{course.name}</option>
                  ))}
                </select>
              </div>

              {/* Quiz Settings */}
              <div className="space-y-4 mb-8">
                {/* Number of Questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Questions
                  </label>
                  <select
                    value={quizDetails.numberOfQuestions}
                    onChange={(e) => setQuizDetails(prev => ({
                      ...prev,
                      numberOfQuestions: parseInt(e.target.value)
                    }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {[5, 10, 15, 20].map(num => (
                      <option key={num} value={num}>{num} Questions</option>
                    ))}
                  </select>
                </div>
                
                {/* Quiz Limit Notice */}
                <QuizLimitNotice 
                  selectedQuestionCount={quizDetails.numberOfQuestions} 
                  maxQuestionCount={maxQuestionCount} 
                />
                
                {/* Display generation error if there is one */}
                {generationError && (
                  <QuizGenerationError 
                    error={generationError} 
                    maxQuestions={maxQuestionCount} 
                    onRetry={retryWithFewerQuestions} 
                  />
                )}

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={quizDetails.difficulty}
                    onChange={(e) => setQuizDetails(prev => ({
                      ...prev,
                    difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard'
                    }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {['Easy', 'Medium', 'Hard'].map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                {/* Time per Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time per Question (seconds)
                  </label>
                  <select
                    value={quizDetails.timePerQuestion}
                    onChange={(e) => setQuizDetails(prev => ({
                      ...prev,
                      timePerQuestion: parseInt(e.target.value)
                    }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {[15, 30, 45, 60].map(time => (
                      <option key={time} value={time}>{time} seconds</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Generate Button and History Button */}
              <div className="mt-8 space-y-4">
                <button
                  onClick={generateQuiz}
                  disabled={loading || !selectedCourse}
                  className={`w-full py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    loading || !selectedCourse
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generating Quiz...
                    </span>
                  ) : (
                    <>
                      <Target className="w-5 h-5" />
                      <span>Generate Quiz</span>
                    </>
                  )}
                </button>

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Quiz Performance History
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Track your progress and review past quiz attempts
                      </p>
                    </div>
                    <button
                    onClick={handleToggleHistory}
                    className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg transition-all"
                    >
                      <History className="w-5 h-5" />
                      <span>{showHistory ? 'Hide History' : 'View History'}</span>
                    </button>
                  </div>
                  
                  {/* Filter and Sort Controls - Moved above both history and stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'difficulty')}
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="date">Date (Newest First)</option>
                        <option value="score">Score (Highest First)</option>
                        <option value="difficulty">Difficulty</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Filter by Difficulty
                      </label>
                      <select
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="all">All Difficulties</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Filter by Course
                      </label>
                      <select
                        value={filterCourse}
                        onChange={(e) => setFilterCourse(e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="all">All Courses</option>
                        {uniqueCourses.map(course => (
                          <option key={course} value={course}>{course}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Statistics Box */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Your Quiz Statistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full mr-3">
                            <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Quizzes</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">
                              {filteredAndSortedHistory.length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full mr-3">
                            <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Average Score</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">
                              {filteredAndSortedHistory.length > 0
                                ? Math.round(
                                    filteredAndSortedHistory.reduce(
                                      (sum, quiz) => sum + (quiz.score / quiz.totalQuestions) * 100,
                                      0
                                    ) / filteredAndSortedHistory.length
                                  )
                                : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                        <div className="flex items-center">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full mr-3">
                            <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Latest Quiz</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">
                              {filteredAndSortedHistory.length > 0
                                ? Math.round(
                                    (filteredAndSortedHistory[0].score / 
                                     filteredAndSortedHistory[0].totalQuestions) * 100
                                  )
                                : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable History Section */}
                  {showHistory && (
                    <div className="mt-6">
                      {/* Quiz History List */}
                      {isLoadingHistory ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                      ) : filteredAndSortedHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                            <History className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-300">
                            No quiz attempts found yet.
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                            Complete your first quiz to start building your history!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredAndSortedHistory.map((attempt) => (
                          <div key={attempt.id}
                              className="bg-white dark:bg-gray-800 p-4 rounded-lg hover:shadow-md transition-shadow">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {attempt.courseName}
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                                      <Award className="w-4 h-4 mr-2" />
                                      <span>Score: {attempt.score}/{attempt.totalQuestions}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                                      <Target className="w-4 h-4 mr-2" />
                                      <span>Difficulty: {attempt.difficulty}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className={`text-sm ${
                                        (attempt.score / attempt.totalQuestions) * 100 >= 70 ? 'text-green-500' : 
                                        (attempt.score / attempt.totalQuestions) * 100 >= 50 ? 'text-yellow-500' : 
                                        'text-red-500'
                                      }`}>
                                        {((attempt.score / attempt.totalQuestions) * 100).toFixed(0)}% Success Rate
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>{format(new Date(attempt.date), 'PPp')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  if (quizStarted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className={`container mx-auto px-4 py-8`}
      >
        <div className={`max-w-2xl mx-auto bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-xl shadow-lg p-8`}>
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            Multiple Choice Questions
          </h2>
          {renderQuestion()}
        </div>
      </motion.div>
    );
  }
if (currentQuestion >= questions?.length && questions?.length > 0) {
    const finalScore = calculateFinalScore();
  const scorePercentageValue = (finalScore / questions?.length) * 100;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 sm:p-10">
            <div className="flex justify-center mb-6">
              <Award className="w-12 h-12 text-indigo-600 dark:text-indigo-300" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Your Score: {finalScore}/{questions?.length}</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {scorePercentageValue}% Correct
            </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Difficulty</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                    {quizDetails.difficulty}
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                  <ClipboardList className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {renderResultActions()}
          </div>
        </div>
        </div>
      </motion.div>
    );
  }
  const formatTimeSpent = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    if (minutes === 0) {
      return `${seconds} sec`;
    }
    return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} sec`;
  };
  return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
    {/* Add the loading overlay */}
    {renderGenerationOverlay(loading)}
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Rest of existing UI... */}
                </div>
                    </div>
  );
};

const calculateStats = (history: any[]) => {
    const totalQuizzes = history.length;
    const totalQuestions = history.reduce((sum, quiz) => 
        sum + (quiz.questions?.length || 0), 0);
    const totalCorrect = history.reduce((sum, quiz) => 
        sum + (quiz.correctAnswers || 0), 0);
    
    return {
        totalQuizzes,
        questionsAnswered: totalQuestions,
        averageScore: totalQuestions > 0 ? 
            ((totalCorrect / totalQuestions) * 100).toFixed(1) : '0',
        latestScore: history.length > 0 ? 
            ((history[0].correctAnswers / history[0].questions.length) * 100).toFixed(1) : '0'
    };
};

const renderGenerationOverlay = (isLoading: boolean): React.ReactNode => {
  return (
    <QuizGenerationOverlay loading={isLoading} />
  );
};

// Add a helper function for case-insensitive comparisons
const caseInsensitiveCompare = (str1: string | null, str2: string | null): boolean => {
  if (!str1 || !str2) return false;
  return str1.toUpperCase() === str2.toUpperCase();
};

// Helper function to check if all questions have been viewed/answered
const allQuestionsViewed = (states: QuestionState[]) => {
  // Check if all questions have been viewed
  return states.every(state => state.viewed);
};

export default Quiz;