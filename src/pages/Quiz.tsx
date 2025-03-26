import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuiz } from '../context/QuizContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  User,
  Send,
  Award,
  AlertCircle,
  Loader2,
  Timer,
  XCircle,
  CheckCircle,
  Target,
  Calendar,
  History as HistoryIcon,
  ClipboardList,
  BookOpen,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart2
} from 'lucide-react';
import axiosInstance from '../config/axios';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Course, QuizAttempt } from '../types';
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

// Improved answer correctness determination function
const determineAnswerCorrectness = (selectedAnswer: string, optionText: string, correctAnswer: string): boolean => {
  if (!correctAnswer) return false;
  
  // Normalize all strings for comparison
  const normalizedSelected = selectedAnswer.trim().toUpperCase();
  const normalizedText = optionText.trim().toUpperCase();
  const normalizedCorrect = correctAnswer.trim().toUpperCase();
  
  console.log('Comparing answers:', {
    selectedAnswer: normalizedSelected,
    optionText: normalizedText,
    correctAnswer: normalizedCorrect
  });
  
  // Check several ways the answer might match
  // 1. Direct match with the option letter (A, B, C, D)
  if (normalizedSelected === normalizedCorrect) {
    console.log("Match found: Option letter matches directly");
    return true;
  }
  
  // 2. The option text matches the correct answer text
  if (normalizedText === normalizedCorrect) {
    console.log("Match found: Option text matches correct answer text");
    return true;
  }
  
  // 3. The correct answer might be referring to the option by its position
  if (['A', 'B', 'C', 'D'].includes(normalizedSelected) && 
      ['A', 'B', 'C', 'D'].includes(normalizedCorrect)) {
    if (normalizedSelected === normalizedCorrect) {
      console.log("Match found: Option letter position matches");
      return true;
    }
  }
  
  console.log("No match found between the selected answer and correct answer");
  return false;
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
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [quizDetails, setQuizDetails] = useState<QuizDetails>({
    numberOfQuestions: 5,
    difficulty: 'Hard',
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
  const [quizSubmitted, setQuizSubmitted] = useState(false);
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

  // Function to set up the showContinue state if it doesn't exist
  const [showContinue, setShowContinue] = useState(false);

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

// Update the generateQuiz function to respect the user's selection for the number of questions
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

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

    // Use the user's selected number of questions while keeping Hard difficulty
    const quizParams = {
        courseId: selectedCourse,
      numberOfQuestions: quizDetails.numberOfQuestions, // Respect user's selection
      difficulty: 'Hard', // Keep hardcoded to Hard difficulty
        timePerQuestion: quizDetails.timePerQuestion
    };

    console.log('Sending quiz generation request with params:', quizParams);

    // Update only the difficulty in the UI to reflect the hardcoded setting
    setQuizDetails(prev => ({
      ...prev,
      difficulty: 'Hard'
    }));

    // Send request to generate quiz
    const response = await axiosInstance.post('/api/generate-quiz', quizParams, {
        timeout: 15000, // 15 seconds timeout
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

    if (response.data) {
      // Process the quiz questions with consistent formatting
      const formattedQuestions = response.data.map((q: any) => {
        // Ensure correctAnswer exists and is properly formatted
        let correctAnswer = q.correctAnswer?.toUpperCase().trim();
        
        // Add validation to ensure correctAnswer is always a valid single letter
        if (!correctAnswer || !['A', 'B', 'C', 'D'].includes(correctAnswer)) {
          console.warn(`Invalid correctAnswer found: "${correctAnswer}" for question: "${q.question}"`);
          // Set a default correct answer if missing or invalid (use first option as fallback)
          correctAnswer = 'A';
        }
        
        console.log(`Question: "${q.question}", correctAnswer: "${correctAnswer}"`);
        
        return {
          ...q,
          correctAnswer: correctAnswer, // Ensure uppercase and trimmed for consistency
        };
      });

      console.log('Formatted questions with validated correctAnswers:', formattedQuestions);

      // Set the questions with consistent format
      setQuestions(formattedQuestions);
      setQuestionStates(Array(formattedQuestions.length).fill({
      userAnswer: null,
      timeExpired: false,
      viewed: false,
      timeLeft: quizDetails.timePerQuestion
    }));
    setCurrentQuestion(0);
      setSelectedAnswer(null);
    setScore(0);
    setQuizStarted(true);
      setShowResult(false);
      setQuizSubmitted(false);
    setStartTime(new Date());
      setTimeLeft(quizDetails.timePerQuestion);
      setTimerActive(true);
    } else {
      throw new Error('No data returned from quiz generation');
    }
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    
    let errorMessage = 'Failed to generate quiz. Please try again.';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    toast.error(errorMessage);
      setGenerationError(errorMessage);
  } finally {
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

  // Ensure consistent feedback across all combinations of question counts and difficulty
  const handleAnswerSelect = React.useCallback((selectedLetter: string, optionText: string) => {
    if (!questions || currentQuestion >= questions.length) return;
    
    const currentQuestionObj = questions[currentQuestion];
    
    // Always normalize answers to uppercase for consistent comparison
    const normalizedCorrectAnswer = currentQuestionObj.correctAnswer.toUpperCase().trim();
    const normalizedSelectedAnswer = selectedLetter.toUpperCase().trim();
    
    // Direct letter comparison
    const isCorrect = normalizedSelectedAnswer === normalizedCorrectAnswer;
    
    console.log(`Selected: "${normalizedSelectedAnswer}", Correct: "${normalizedCorrectAnswer}", isCorrect: ${isCorrect}`);
    
    // Set the selected answer in state
    setSelectedAnswer(selectedLetter);
    
    // CRITICAL: Always mark the question as viewed to ensure feedback is shown
    setQuestionStates(prevStates => {
      const newStates = [...prevStates];
      newStates[currentQuestion] = {
        ...newStates[currentQuestion],
        userAnswer: selectedLetter.toUpperCase(), // Always store uppercase
        viewed: true, // ALWAYS true to show feedback
        isCorrect: isCorrect
      };
      return newStates;
    });
    
    // If correct and not previously answered, increase score
    if (isCorrect && !questionStates[currentQuestion]?.viewed) {
      setScore(prevScore => prevScore + 1);
    }
    
    // Always show the result
    setShowResult(true);
    
    // Stop the timer
    setTimerActive(false);
  }, [currentQuestion, questions, questionStates, score]);

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
    if (percentage >= 90) return "Excellent! You've mastered this topic!";
    if (percentage >= 80) return "Great job! You have a strong understanding!";
    if (percentage >= 70) return "Good work! Keep practicing to improve further.";
    if (percentage >= 60) return "Not bad! A bit more study will help.";
    return "You might want to review this topic and try again.";
  }, []);

  const fetchQuizHistoryCallback = React.useCallback(fetchQuizHistory, [historyFetched, quizHistory.length]);
  const saveQuizResult = React.useCallback(async (finalScore: number) => {
    if (!user?._id || !selectedCourse || !questions || !questionStates) {
      console.error('Quiz data not found. Please ensure all data is available before saving.');
      return;
    }
    
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
            
            // Enhanced regex to remove duplicate prefixes
            optionText = optionText
              // First, handle double prefixes like "A. A:" or "D) D:"
              .replace(/^([A-Da-d])[.):]\s*\1[.):]\s*/g, '')
              // Then handle single prefixes like "A." or "A)"
              .replace(/^[A-Da-d][.):]\s*/g, '')
              // Also handle cases with just a letter and space
              .replace(/^[A-Da-d]\s+/g, '')
              .trim();
            
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
        // Normalize user answer and correct answer for consistency
        const userAnswer = questionStates[index]?.userAnswer?.toUpperCase() || null;
        const correctAnswer = q.correctAnswer.toUpperCase();
        
        // Determine correctness consistently
        const isCorrect = userAnswer === correctAnswer;
        
        return {
          question: q.question,
          options: q.options.map((opt, optIndex) => {
            // Get option text and clean it
            let optionText = typeof opt === 'object' && opt !== null && 'text' in opt 
              ? (opt as {text: string}).text 
              : String(opt);
            
            // Enhanced regex to remove various duplicate letter prefixes
            optionText = optionText
              // First, handle double prefixes like "A. A:" or "D) D:"
              .replace(/^([A-Da-d])[.):]\s*\1[.):]\s*/g, '')
              // Then handle single prefixes like "A." or "A)"
              .replace(/^[A-Da-d][.):]\s*/g, '')
              // Also handle cases with just a letter and space
              .replace(/^[A-Da-d]\s+/g, '')
              .trim();
            
            return {
              text: optionText,
              label: String.fromCharCode(65 + optIndex) // Always A, B, C, D
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
    
    // Save the quiz data to both local storage and the quiz context
    localStorage.setItem('quizData', JSON.stringify(quizData));
    setQuizData(quizData);
    
    console.log("Quiz data saved for AI Assistant:", quizData);
    toast.success("Quiz data prepared for AI analysis");
    
    // Navigate to the AI Assist page
    navigate('/ai-assist');
  }, [courses, selectedCourse, questions, questionStates, score, quizDetails.difficulty, setQuizData, navigate]);

  // Make sure handleNextQuestion and handlePreviousQuestion are being used
  const handleNextQuestion = React.useCallback(() => {
    if (!questions || !questionStates) return;
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
        setTimeLeft(quizDetails.timePerQuestion);
        setTimerActive(true);
      setShowContinue(false);
      }
  }, [currentQuestion, questions, quizDetails.timePerQuestion, questionStates]);

  const handlePreviousQuestion = React.useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setShowContinue(true);
    }
  }, [currentQuestion]);

  // Update the handleFinishQuiz function to ensure consistent quiz data is passed to both results and AI assist
  const handleFinishQuiz = React.useCallback(() => {
    setTimerActive(false);
    const finalScore = calculateFinalScore();
    
    // Prepare quiz data with complete and consistent question details
    const quizData = {
      questions: questions.map((q, index) => {
        // Normalize options format consistently
        const questionOptions = q.options.map((opt, optIndex) => {
          // Get option text and clean it
          let optionText = typeof opt === 'object' && opt !== null && 'text' in opt 
            ? (opt as {text: string}).text 
            : String(opt);
          
          // Enhanced regex to remove various duplicate letter prefixes
          optionText = optionText
            // First, handle double prefixes like "A. A:" or "D) D:"
            .replace(/^([A-Da-d])[.):]\s*\1[.):]\s*/g, '')
            // Then handle single prefixes like "A." or "A)"
            .replace(/^[A-Da-d][.):]\s*/g, '')
            // Also handle cases with just a letter and space
            .replace(/^[A-Da-d]\s+/g, '')
            .trim();
          
          return {
            text: optionText,
            label: String.fromCharCode(65 + optIndex) // Always A, B, C, D
          };
        });
        
        // Ensure consistent userAnswer and correctAnswer format
        const userAnswer = questionStates[index]?.userAnswer?.toUpperCase() || null;
        const correctAnswer = q.correctAnswer.toUpperCase();
        const isCorrect = userAnswer === correctAnswer;
        
        return {
          question: q.question,
          options: questionOptions,
          correctAnswer: correctAnswer,
          userAnswer: userAnswer,
          isCorrect: isCorrect
        };
      }),
      score: finalScore,
      totalQuestions: questions.length,
      courseName: courses.find(course => course._id === selectedCourse)?.name || '',
      difficulty: quizDetails.difficulty, // Use the current difficulty setting
      timestamp: new Date().toISOString()
    };
    
    // Log the prepared data for debugging
    console.log("Prepared quiz data for results and AI assist:", quizData);
    
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
      
      // Use the already prepared quizData for the results page
        setQuizData(quizData);
        navigate('/quiz-results', { 
          state: quizData,
          replace: true 
        });
    });
  }, [questions, questionStates, courses, selectedCourse, quizDetails.difficulty, calculateFinalScore, saveQuizResult, navigate, setQuizData]);

  // Function to handle navigation between questions via the question number buttons
  const handleQuestionNav = React.useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestion(index);
      const state = questionStates[index];
      setSelectedAnswer(state?.userAnswer || null);
      setShowResult(state?.viewed || false);
      setTimerActive(false);
    }
  }, [questions.length, questionStates, setCurrentQuestion, setSelectedAnswer, setShowResult, setTimerActive]);

  // Function to reset quiz state
  const resetQuiz = useCallback(() => {
    setQuestions([]);
    setCurrentQuestion(0);
    setQuestionStates([]);
    setScore(0);
    setTimeLeft(quizDetails.timePerQuestion);
    setTimerActive(false);
    setQuizStarted(false);
    setShowResult(false);
    setQuizSubmitted(false);
    setStartTime(null);
  }, [quizDetails.timePerQuestion]);

  // Function to submit the quiz and show results
  const handleSubmitQuiz = React.useCallback(() => {
    setQuizSubmitted(true);
    handleFinishQuiz();
  }, [handleFinishQuiz]);

  // Update the renderQuestion function to always show feedback when an answer is selected
  const renderQuestion = React.useCallback(() => {
    if (!questions || !questions[currentQuestion]) return null;
    const currentQuestionObj = questions[currentQuestion];
    const questionState = questionStates[currentQuestion] || {
      userAnswer: null,
      timeExpired: false,
      viewed: false,
      timeLeft: quizDetails.timePerQuestion
    };
    const selectedAnswer = questionState.userAnswer;
    
    // Determine if we should show feedback
    const showFeedback = selectedAnswer !== null;

                  return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <motion.h3 
          className="text-lg font-bold mb-4 text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentQuestionObj.question}
        </motion.h3>
        
        <div className="space-y-2">
          {currentQuestionObj.options.map((option, idx) => {
            const optionText = typeof option === 'object' && option !== null && 'text' in option 
              ? (option as {text: string}).text 
              : String(option);
            
            const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
            const isSelected = selectedAnswer === optionLabel;
            
            // Determine if the answer is correct
            const correctAnswer = currentQuestionObj.correctAnswer.toUpperCase();
            const isCorrect = optionLabel.toUpperCase() === correctAnswer.toUpperCase();
            const isWrong = isSelected && !isCorrect;
            
            // Get background color based on answer state
            const getBgColor = () => {
              if (!showFeedback) {
                // No selection made yet
                return 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30';
              }
              
              if (isSelected && isCorrect) {
                // Selected and correct
                return 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700';
              } else if (isSelected && isWrong) {
                // Selected and wrong
                return 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700';
              } else if (isCorrect && showFeedback) {
                // This is the correct answer but wasn't selected
                return 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700';
              } else {
                // Not selected and not correct
                return 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700';
              }
            };
            
            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <div 
                  onClick={() => !showFeedback && handleAnswerSelect(optionLabel, optionText)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between
                    ${getBgColor()}
                  `}
              >
                <div className="flex items-center">
                    <span className={`
                      flex items-center justify-center w-6 h-6 rounded-full mr-3 text-sm font-medium
                      ${isSelected && isCorrect ? 'bg-green-500 text-white' : 
                        isSelected && isWrong ? 'bg-red-500 text-white' : 
                        isCorrect && showFeedback ? 'bg-green-500 text-white' : 
                        'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'}
                    `}>
                      {optionLabel}
                      </span>
                    <span className="text-gray-700 dark:text-gray-300">{optionText}</span>
              </div>
                  
                  {/* Always show answer feedback if an option is selected */}
                  {showFeedback && (
                    <div className="flex items-center ml-auto">
                      {isSelected && isWrong && (
                        <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center ml-2 text-red-600 dark:text-red-400"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium whitespace-nowrap">Your answer</span>
                        </motion.div>
                      )}
                      
                      {isSelected && isCorrect && (
                        <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center ml-2 text-green-600 dark:text-green-400"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium whitespace-nowrap">Your answer - Correct</span>
                        </motion.div>
                      )}
                      
                      {isCorrect && !isSelected && (
                        <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center ml-2 text-green-600 dark:text-green-400"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium whitespace-nowrap">Correct answer</span>
                        </motion.div>
                      )}
            </div>
                  )}
          </div>
              </motion.div>
            );
          })}
            </div>
            
        {/* Navigation buttons - ALWAYS VISIBLE */}
        <motion.div 
          className="mt-4 flex flex-wrap justify-between items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Previous Button - Always visible */}
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
            className={`px-3 py-1.5 rounded-lg transition-all text-sm ${
              currentQuestion === 0
                ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600'
            }`}
          >
                Previous
              </button>

          {/* Action Buttons - Always visible */}
          <div className="flex gap-2">
            {/* AI Help Button - Always visible */}
                <button
              onClick={handleGetAIHelp}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-all dark:bg-purple-700 dark:hover:bg-purple-600"
            >
              Get AI Help
                </button>

            {/* Finish Quiz Button - Always visible but disabled unless on last question */}
                <button
              onClick={handleFinishQuiz}
              disabled={currentQuestion !== questions.length - 1}
              className={`px-3 py-1.5 text-white text-sm rounded-lg transition-all ${
                currentQuestion === questions.length - 1
                  ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
                  : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              Finish Quiz
                </button>
        </div>
          
          {/* Next Button - Always visible */}
          <button
            onClick={handleNextQuestion}
            disabled={currentQuestion === questions.length - 1}
            className={`px-3 py-1.5 rounded-lg transition-all text-sm ${
              currentQuestion === questions.length - 1
                ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600'
            }`}
          >
            Next
          </button>
        </motion.div>
      </div>
    );
  }, [currentQuestion, questions, questionStates, handleAnswerSelect, handleNextQuestion, handlePreviousQuestion, handleFinishQuiz, handleGetAIHelp, quizDetails.timePerQuestion]);

  // Memoized values
  const uniqueCourses = useMemo(() => {
    if (!formattedQuizHistory) return [];
    const courses = new Set(formattedQuizHistory.map(quiz => quiz.courseName));
    return Array.from(courses);
  }, [formattedQuizHistory]);

  const filteredAndSortedHistory = useMemo(() => {
    if (!formattedQuizHistory) return [];
    
    // Filter out any entries with 'Loading...' as courseName
    const filteredHistory = formattedQuizHistory.filter(quiz => quiz.courseName !== 'Loading...');
    
    // Apply filters
    let filtered = filteredHistory.filter(quiz => {
        if (filterDifficulty !== 'all' && quiz.difficulty !== filterDifficulty) return false;
        if (filterCourse !== 'all' && quiz.courseName !== filterCourse) return false;
        return true;
    });
    
    // Apply sorting
    return filtered.sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'score') {
        const scoreA = (a.score / a.totalQuestions) * 100;
        const scoreB = (b.score / b.totalQuestions) * 100;
        return scoreB - scoreA;
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

  // Add this useEffect to scroll to top when quiz starts
  useEffect(() => {
    if (quizStarted) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [quizStarted]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-4 hover:shadow-xl transition-all duration-300`}>
                <h2 className="text-lg font-semibold mb-3 text-center text-white">Quizzes per Course</h2>
                <div className="h-[330px]">
                  <Pie data={successRateData} options={pieOptions} />
                </div>
              </div>
              
              <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-4 hover:shadow-xl transition-all duration-300`}>
                <h2 className="text-lg font-semibold mb-3 text-center text-white">Success Rate by Course</h2>
                <div className="h-[330px]">
                  <Pie data={successRateData} options={pieOptions} />
                </div>
              </div>
              
              <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-4 md:col-span-2 hover:shadow-xl transition-all duration-300`}>
                <h2 className="text-lg font-semibold mb-3 text-center text-white">Correct vs Wrong Answers</h2>
                <div className="h-[300px]">
                  <Bar data={correctVsWrongData} options={barOptions} />
                </div>
              </div>
            </div>
          )}

          {/* Gemini AI Quote */}
          <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-6 mb-6 hover:shadow-xl transition-all duration-300`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4v2m0 4v2m0 4v2M8 10h8v4H8z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">Gemini AI Says:</p>
                <blockquote className="text-gray-700 dark:text-gray-300 italic text-lg">
                  "Learning is not just about getting the right answers, but understanding why they're right. Each quiz is a step towards mastery, and every mistake is an opportunity to grow. Keep pushing your boundaries!"
                </blockquote>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  - Generated by Gemini AI for your learning journey
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Selection Section */}
          <div className="max-w-full mx-auto mb-6">
            <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    Select a Course for Quiz
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Choose a course to generate questions from
                  </p>
                </div>
              </div>
              
              {/* Course Selection Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Available Courses
                </label>
                <div className="relative">
                  {/* Replace with auto-scrolling vertical grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-200 dark:scrollbar-thumb-purple-500 dark:scrollbar-track-gray-700">
                    {courses.map((course) => (
                      <motion.button
                        key={course._id}
                        onClick={() => setSelectedCourse(course._id)}
                        className={`p-3 rounded-lg transition-all relative overflow-hidden group ${
                          selectedCourse === course._id
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                        }`}
                        whileHover={{ 
                          scale: 1.05, 
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                          backgroundColor: selectedCourse === course._id ? "" : "#f3f4f6",
                          color: selectedCourse === course._id ? "#ffffff" : "#4f46e5",
                          borderColor: selectedCourse === course._id ? "" : "#4f46e5" 
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                        <span className="relative z-10">{course.name}</span>
                      </motion.button>
                    ))}
                  </div>
                  
                  {/* Add a scroll fade at the bottom for visual indication */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
                </div>
              </div>

              {/* Quiz Settings */}
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Number of Questions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Questions
                    </label>
                    <div className="relative">
                      <div className="grid grid-cols-2 gap-2 pr-1">
                        {[5, 10, 15, 20].map(num => (
                          <motion.button
                            key={num}
                            onClick={() => setQuizDetails(prev => ({
                              ...prev,
                              numberOfQuestions: num
                            }))}
                            className={`p-2 rounded-lg transition-all ${
                              quizDetails.numberOfQuestions === num
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {num} Questions
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty Level
                    </label>
                    <div className="relative">
                      <div className="grid grid-cols-1 gap-2 pr-1">
                        {['Easy', 'Medium', 'Hard'].map(level => (
                          <motion.button
                            key={level}
                            onClick={() => setQuizDetails(prev => ({
                              ...prev,
                              difficulty: level as 'Easy' | 'Medium' | 'Hard'
                            }))}
                            className={`p-2 rounded-lg transition-all ${
                              quizDetails.difficulty === level
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {level}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Time per Question */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time per Question
                    </label>
                    <div className="relative">
                      <div className="grid grid-cols-2 gap-2 pr-1">
                        {[15, 30, 45, 60].map(time => (
                          <motion.button
                            key={time}
                            onClick={() => setQuizDetails(prev => ({
                              ...prev,
                              timePerQuestion: time
                            }))}
                            className={`p-2 rounded-lg transition-all ${
                              quizDetails.timePerQuestion === time
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {time} seconds
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
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
              </div>

              {/* Generate Button */}
              <div className="mt-8">
                <motion.button
                  onClick={generateQuiz}
                  disabled={loading || !selectedCourse}
                  className={`w-full py-3 rounded-lg transition-all flex items-center justify-center space-x-2 ${
                    loading || !selectedCourse
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md'
                  }`}
                  whileHover={loading || !selectedCourse ? {} : { scale: 1.02, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  whileTap={loading || !selectedCourse ? {} : { scale: 0.98 }}
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
                      <span className="font-medium">Generate Quiz</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Quiz Performance History Section */}
          <div className="max-w-full mx-auto">
            <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Quiz Performance History
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Track your progress and review past quiz attempts
                  </p>
                </div>
                <motion.button
                  onClick={handleToggleHistory}
                  className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg transition-all shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    y: [0, -5, 0],
                    transition: { 
                      repeat: showHistory ? 0 : Infinity, 
                      repeatType: "reverse", 
                      duration: 1.5 
                    }
                  }}
                >
                  <HistoryIcon className="w-5 h-5" />
                  <span>{showHistory ? 'Hide History' : 'View History'}</span>
                </motion.button>
              </div>
              
              {/* Statistics Box */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Your Quiz Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div 
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
                    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full mr-3">
                        <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Quizzes</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                          {filteredAndSortedHistory.length}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
                    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full mr-3">
                        <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
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
                  </motion.div>
                  
                  <motion.div 
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
                    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full mr-3">
                        <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Latest Quiz</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                          {filteredAndSortedHistory.length > 0
                            ? Math.round(
                                (filteredAndSortedHistory[0].score / 
                                 filteredAndSortedHistory[0].totalQuestions) * 100
                              )
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Expandable History Section */}
              {showHistory && (
                <motion.div 
                  className="mt-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Filter and Sort Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sort By
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          {value: 'date', label: 'Date (Newest First)'},
                          {value: 'score', label: 'Score (Highest First)'},
                          {value: 'difficulty', label: 'Difficulty'}
                        ].map(option => (
                          <motion.button
                            key={option.value}
                            onClick={() => setSortBy(option.value as 'date' | 'score' | 'difficulty')}
                            className={`p-2 rounded-lg transition-all ${
                              sortBy === option.value
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {option.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Filter by Difficulty
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          onClick={() => setFilterDifficulty('all')}
                          className={`p-2 rounded-lg transition-all ${
                            filterDifficulty === 'all'
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          All Difficulties
                        </motion.button>
                        {['Easy', 'Medium', 'Hard'].map(level => (
                          <motion.button
                            key={level}
                            onClick={() => setFilterDifficulty(level)}
                            className={`p-2 rounded-lg transition-all ${
                              filterDifficulty === level
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {level}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Filter by Course
                      </label>
                      <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1">
                        <motion.button
                          onClick={() => setFilterCourse('all')}
                          className={`p-2 rounded-lg transition-all ${
                            filterCourse === 'all'
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          All Courses
                        </motion.button>
                        {uniqueCourses.map(course => (
                          <motion.button
                            key={course}
                            onClick={() => setFilterCourse(course)}
                            className={`p-2 rounded-lg transition-all ${
                              filterCourse === course
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {course}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quiz History List */}
                  {isLoadingHistory ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : filteredAndSortedHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                        <HistoryIcon className="w-10 h-10 text-gray-500 dark:text-gray-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-lg">
                        No quiz attempts found yet.
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                        Complete your first quiz to start building your history!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredAndSortedHistory.map((attempt) => (
                        <motion.div 
                          key={attempt.id}
                          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                          whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {attempt.courseName}
                              </h4>
                              <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                                (attempt.score / attempt.totalQuestions) * 100 >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                (attempt.score / attempt.totalQuestions) * 100 >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {((attempt.score / attempt.totalQuestions) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center text-gray-600 dark:text-gray-300">
                                <Award className="w-4 h-4 mr-2" />
                                <span>Score: {attempt.score}/{attempt.totalQuestions}</span>
                              </div>
                              <div className="flex items-center text-gray-600 dark:text-gray-300">
                                <Target className="w-4 h-4 mr-2" />
                                <span>Difficulty: {attempt.difficulty}</span>
                              </div>
                            </div>
                            <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>{format(new Date(attempt.date), 'PPp')}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mt-1">
                              <div 
                                className={`h-full rounded-full ${
                                  (attempt.score / attempt.totalQuestions) * 100 >= 70 ? 'bg-green-500' : 
                                  (attempt.score / attempt.totalQuestions) * 100 >= 50 ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`}
                                style={{ width: `${(attempt.score / attempt.totalQuestions) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
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
        transition={{ duration: 0.5 }}
        className="container mx-auto px-2 py-4"
      >
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Course information banner */}
          <div className="bg-indigo-600 dark:bg-indigo-700 p-3 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">
                  {courses.find(c => c._id === selectedCourse)?.name || 'Quiz'}
          </h2>
                <p className="text-sm opacity-90">Difficulty: {quizDetails.difficulty}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Total questions: {questions.length}</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Header with progress */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 font-bold mr-2">
                  {currentQuestion + 1}
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Question {currentQuestion + 1} of {questions.length}
                </h3>
              </div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Score: {score}/{currentQuestion}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mb-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>

            {/* Timer display with color change */}
            <div className="mb-3 text-center">
              <div 
                className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-white font-bold text-sm
                  ${timeLeft > quizDetails.timePerQuestion * 0.75 ? 'bg-green-500 dark:bg-green-600' : 
                    timeLeft > quizDetails.timePerQuestion * 0.5 ? 'bg-blue-500 dark:bg-blue-600' : 
                    timeLeft > quizDetails.timePerQuestion * 0.25 ? 'bg-yellow-500 dark:bg-yellow-600' : 
                    'bg-red-500 dark:bg-red-600 animate-pulse'}`}
              >
                {(() => {
                  // Inline time formatting function
                  const minutes = Math.floor(timeLeft / 60);
                  const seconds = timeLeft % 60;
                  return minutes > 0 
                    ? `${minutes}:${seconds < 10 ? '0' : ''}${seconds}` 
                    : `${seconds}s`;
                })()}
              </div>
            </div>
            
            {/* Question navigation buttons */}
            <div className="flex overflow-x-auto pb-2 mb-3 gap-1">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionNav(index)}
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium 
                    ${currentQuestion === index ? 'bg-indigo-600 text-white' : 
                      questionStates[index]?.viewed ? 
                        questionStates[index]?.isCorrect ? 'bg-green-100 text-green-800 border border-green-500' : 
                        'bg-red-100 text-red-800 border border-red-500' :
                      questionStates[index]?.userAnswer ? 'bg-blue-100 text-blue-800 border border-blue-500' : 
                      'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            {/* Question content */}
          {renderQuestion()}
          </div>
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
            {/* Animated confetti effect for good scores */}
            {scorePercentageValue >= 70 && (
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-0 left-0 w-6 h-24 bg-yellow-400 rotate-45 opacity-70 animate-fall-slow"></div>
                <div className="absolute top-0 left-1/4 w-4 h-16 bg-blue-500 rotate-12 opacity-70 animate-fall-medium"></div>
                <div className="absolute top-0 left-1/2 w-5 h-20 bg-red-500 -rotate-45 opacity-70 animate-fall-fast"></div>
                <div className="absolute top-0 left-3/4 w-4 h-16 bg-green-500 rotate-45 opacity-70 animate-fall-slow"></div>
                <div className="absolute top-0 right-0 w-6 h-24 bg-purple-500 -rotate-12 opacity-70 animate-fall-medium"></div>
              </div>
            )}
            
          <div className="p-6 sm:p-10">
            <div className="flex justify-center mb-6">
                {scorePercentageValue >= 70 ? (
                  <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                    <Award className="w-16 h-16 text-yellow-500 dark:text-yellow-400" />
            </div>
                ) : scorePercentageValue >= 50 ? (
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Award className="w-16 h-16 text-blue-500 dark:text-blue-400" />
                  </div>
                ) : (
                  <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Award className="w-16 h-16 text-purple-500 dark:text-purple-400" />
                  </div>
                )}
              </div>
              
              <h3 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                {scorePercentageValue >= 80 ? '🎉 Excellent!' : 
                 scorePercentageValue >= 60 ? '👏 Well done!' : 
                 scorePercentageValue >= 40 ? '👍 Good effort!' : 
                 '💪 Keep practicing!'}
              </h3>
              
              <div className="flex justify-center items-center gap-3 mb-8">
                <span className="text-2xl font-bold">{finalScore}/{questions?.length}</span>
                <div className="h-10 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div className={`text-2xl font-bold 
                  ${scorePercentageValue >= 70 ? 'text-green-500 dark:text-green-400' : 
                   scorePercentageValue >= 50 ? 'text-blue-500 dark:text-blue-400' : 
                   'text-red-500 dark:text-red-400'}`}>
                  {scorePercentageValue.toFixed(0)}%
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-5 shadow-sm">
                  <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Quiz Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Course:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {courses.find(c => c._id === selectedCourse)?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{quizDetails.difficulty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total time:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {startTime ? `${Math.floor((new Date().getTime() - startTime.getTime()) / 60000)} min` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-5 shadow-sm">
                  <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Performance</h4>
                  <div className="space-y-3">
                <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Correct answers</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                        <div 
                          className="bg-green-500 h-2.5 rounded-full" 
                          style={{ width: `${scorePercentageValue}%` }}
                        ></div>
                </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-500 dark:text-gray-400">0%</span>
                        <span className="text-gray-500 dark:text-gray-400">100%</span>
                      </div>
                    </div>
                    
                    <div className="pt-3">
                      <p className="text-gray-900 dark:text-white">
                        {scorePercentageValue >= 80 ? 'Outstanding performance! You have excellent mastery of this subject.' : 
                         scorePercentageValue >= 60 ? 'Good job! You have a solid understanding of most concepts.' : 
                         scorePercentageValue >= 40 ? 'Nice effort! Keep reviewing to strengthen your knowledge.' : 
                         'Keep practicing! Focus on the concepts you missed to improve.'}
                      </p>
                </div>
              </div>
            </div>
          </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center p-6">
                <button
                  onClick={() => resetQuiz()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:ring-4 focus:ring-indigo-300"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    const courseObj = courses.find(course => course._id === selectedCourse);
                    if (!courseObj) {
                      toast.error("Error: Could not find course information");
                      return;
                    }
                    
                    const quizData = {
                      questions: questions.map((q, index) => ({
                        question: q.question,
                        options: q.options.map((opt, optIndex) => {
                          let optionText = typeof opt === 'object' && opt !== null && 'text' in opt 
                            ? (opt as {text: string}).text 
                            : String(opt);
                          
                          optionText = optionText
                            .replace(/^([A-Da-d])[.):]\s*\1[.):]\s*/g, '')
                            .replace(/^[A-Da-d][.):]\s*/g, '')
                            .replace(/^[A-Da-d]\s+/g, '')
                            .trim();
                          
                          return {
                            text: optionText,
                            label: String.fromCharCode(65 + optIndex)
                          };
                        }),
                        correctAnswer: q.correctAnswer.toUpperCase(),
                        userAnswer: questionStates[index]?.userAnswer?.toUpperCase() || null,
                        isCorrect: questionStates[index]?.userAnswer?.toUpperCase() === q.correctAnswer.toUpperCase()
                      })),
                      score: score,
                      totalQuestions: questions.length,
                      courseName: courseObj.name,
                      difficulty: quizDetails.difficulty,
                      timestamp: new Date().toISOString(),
                      id: `${courseObj.name}-${score}-${questions.length}-${Date.now()}`
                    };
                    
                    localStorage.setItem('quizData', JSON.stringify(quizData));
                    setQuizData(quizData);
                    navigate('/ai-assist');
                  }}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:ring-4 focus:ring-purple-300"
                >
                  Get AI Help
                </button>
              </div>
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
export default Quiz;
