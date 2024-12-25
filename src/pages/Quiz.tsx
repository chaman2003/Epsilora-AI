import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { motion } from 'framer-motion';
import { 
  Target, 
  History, 
  Award, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Book,
  ClipboardList,
  TrendingUp,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import axiosInstance from '../utils/axios';
import { Course, QuizAttempt } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useQuiz } from '../context/QuizContext';
import toast from 'react-hot-toast';
import QuizHistoryModal from '../components/quiz/QuizHistoryModal';
import { themeConfig } from '../config/theme';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

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
  const [formattedQuizHistory, setFormattedQuizHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [historyFetched, setHistoryFetched] = useState(false);
  const [quizStats, setQuizStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    latestScore: 0
  });

  // Chart data preparation
  const [correctVsWrongData, setCorrectVsWrongData] = useState({
    labels: [],
    datasets: []
  });
  const [quizzesPerCourseData, setQuizzesPerCourseData] = useState({
    labels: [],
    datasets: []
  });
  const [successRateData, setSuccessRateData] = useState({
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

  useEffect(() => {
    console.log('Authentication status:', isAuthenticated);
    if (isAuthenticated) {
      fetchCourses();
      fetchQuizHistory();
      fetchQuizStatistics();
    } else {
      setError('Please log in to access your courses');
    }
  }, [isAuthenticated]);

  const fetchCourses = async () => {
    try {
      setError(null);
      console.log('Fetching courses...');
      const coursesResponse = await axiosInstance.get('/api/courses');
      console.log('Raw courses response:', coursesResponse);
      
      if (!coursesResponse.data) {
        console.error('No data in response');
        setError('No courses found');
        setCourses([]);
        return;
      }

      if (Array.isArray(coursesResponse.data)) {
        console.log('Courses array:', coursesResponse.data);
        if (coursesResponse.data.length === 0) {
          setError('No saved courses found. Please save some courses first.');
        }
        setCourses(coursesResponse.data);
      } else {
        console.error('Courses response is not an array:', coursesResponse.data);
        setError('Invalid course data received');
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to fetch courses. Please try again.');
      setCourses([]);
    }
  };

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
        const courseStats = courses.reduce((acc: any, course) => {
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
          labels: Object.values(courseStats).map((s: any) => s.name),
          datasets: [
            {
              label: 'Correct Answers',
              data: Object.values(courseStats).map((s: any) => s.correct),
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
            {
              label: 'Wrong Answers',
              data: Object.values(courseStats).map((s: any) => s.wrong),
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }
          ]
        });

        // Prepare data for Quizzes per Course chart
        const quizzesPerCourse = courses.map(course => ({
          name: course.name.split(' ').slice(0, 3).join(' '),
          count: (quizHistory.filter(q => q.courseId === course._id) || []).length
        }));

        setQuizzesPerCourseData({
          labels: quizzesPerCourse.map(q => q.name),
          datasets: [{
            label: 'Number of Quizzes',
            data: quizzesPerCourse.map(q => q.count),
            backgroundColor: [
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
              'rgba(255, 159, 64, 0.5)',
            ],
          }]
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
  }, [historyFetched, quizHistory.length, user?._id, courses]);

  useEffect(() => {
    if (isAuthenticated && !isLoading && user?._id) {
      fetchQuizHistory();
    }
  }, [isAuthenticated, isLoading, user?._id, fetchQuizHistory]);

  useEffect(() => {
    if (showHistory && isAuthenticated && !historyFetched) {
      fetchQuizHistory();
    }
  }, [showHistory, isAuthenticated, fetchQuizHistory, historyFetched]);

  const fetchQuizStatistics = async () => {
    try {
      // Use axiosInstance instead of direct axios call
      const response = await axiosInstance.get('/api/quiz/stats');
      console.log('Quiz stats response:', response.data);

      if (response.data) {
        setQuizStats({
          totalQuizzes: response.data.totalQuizzes || 0,
          averageScore: response.data.averageScore || 0,
          latestScore: response.data.latestScore || 0
        });
      }
    } catch (error) {
      console.error('Error fetching quiz statistics:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuizStatistics();
    }
  }, [isAuthenticated]);

  const generateQuiz = async () => {
    if (!selectedCourse) {
      toast.error('Please select a course first');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/generate-quiz', {
        courseId: selectedCourse,
        numberOfQuestions: quizDetails.numberOfQuestions,
        difficulty: quizDetails.difficulty,
        timePerQuestion: quizDetails.timePerQuestion
      });

      let quizData;
      try {
        // Handle both string and parsed JSON responses
        const rawData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        // Clean the JSON string
        const cleanedData = rawData.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        quizData = JSON.parse(cleanedData);
      } catch (parseError) {
        console.error('Error parsing quiz data:', parseError);
        console.error('Raw quiz data:', response.data);
        throw new Error('Failed to parse quiz data. Please try again.');
      }

      if (!Array.isArray(quizData)) {
        throw new Error('Invalid quiz format: expected an array of questions');
      }

      if (quizData.length === 0) {
        throw new Error('No questions were generated. Please try again.');
      }

      // Clean and validate each question
      const cleanedQuestions = quizData.map((q, index) => {
        if (!q.question || !Array.isArray(q.options) || !q.correctAnswer) {
          throw new Error(`Invalid question format at index ${index}`);
        }

        return {
          id: q.id || index + 1,
          question: q.question.trim().replace(/\\n/g, '\n').replace(/\\/g, ''),
          options: q.options.map((opt: string) => 
            opt.trim().replace(/\\n/g, '\n').replace(/\\/g, '')
          ),
          correctAnswer: q.correctAnswer.trim().toUpperCase()
        };
      });

      // Validate cleaned questions
      const validQuestions = cleanedQuestions.every(q => 
        q.id && 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length === 4 &&
        q.correctAnswer && 
        ['A', 'B', 'C', 'D'].includes(q.correctAnswer)
      );

      if (!validQuestions) {
        throw new Error('Invalid question format in response');
      }

      setQuestions(cleanedQuestions);
      setQuizStarted(true);
      setCurrentQuestion(0);
      setScore(0);
      setShowResult(false);
      setSelectedAnswer(null);
      setTimeLeft(quizDetails.timePerQuestion);
      setTimerActive(true);
      setStartTime(new Date());
      toast.success('Quiz generated successfully!');
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      let errorMessage = 'Failed to generate quiz. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        console.error('Server error details:', error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questions.length > 0) {
      const initialStates = questions.map(() => ({
        userAnswer: null,
        timeExpired: false,
        viewed: false,
        timeLeft: quizDetails.timePerQuestion
      }));
      setQuestionStates(initialStates);
    }
  }, [questions]);

  const updateQuestionState = React.useCallback((index: number, updates: Partial<QuestionState>) => {
    setQuestionStates(prev => {
      const newStates = [...prev];
      newStates[index] = { ...newStates[index], ...updates };
      return newStates;
    });
  }, []);

  const handleAnswerSelect = React.useCallback((answer: string) => {
    if (showResult || !timerActive || timeLeft === 0) return;
    setSelectedAnswer(answer);
    updateQuestionState(currentQuestion, { userAnswer: answer, viewed: true });
  }, [showResult, timerActive, timeLeft, currentQuestion, updateQuestionState]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1 && !isTransitioning.current) {
            isTransitioning.current = true;
            
            // Time's up - show correct answer and prevent further selection
            setShowResult(true);
            setTimerActive(false);
            updateQuestionState(currentQuestion, { timeExpired: true, viewed: true });
            
            // Auto-proceed to next question after delay, but only if not the last question
            if (currentQuestion < questions.length - 1) {
              setTimeout(() => {
                setCurrentQuestion(currentQuestion + 1);
                setSelectedAnswer(null);
                setShowResult(false);
                setTimeLeft(quizDetails.timePerQuestion);
                setTimerActive(true);
                isTransitioning.current = false;
              }, 2000);
            } else {
              // If it's the last question, just show the final result
              setTimeout(() => {
                setShowResult(true);
                setTimerActive(false);
                isTransitioning.current = false;
              }, 2000);
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft, currentQuestion, questions.length, quizDetails.timePerQuestion, updateQuestionState]);

  const calculateFinalScore = React.useCallback(() => {
    let totalCorrect = 0;
    questions.forEach((question, index) => {
      if (questionStates[index]?.userAnswer === question.correctAnswer) {
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

      const totalTimeSpent = new Date().getTime() - startTime!.getTime();
      const quizData = {
        userId: user?._id,
        courseId: selectedCourse,
        questions: questions.map((q, index) => ({
          question: q.question,
          answer: questionStates[index]?.userAnswer || null,
          correct: questionStates[index]?.userAnswer === q.correctAnswer
        })),
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
    setTimerActive(false);
    const finalScore = calculateFinalScore();
    setScore(finalScore);
    setShowResult(true);
    
    // Prepare quiz data with complete question details
    const quizData = {
      questions: questions.map((q, index) => ({
        question: q.question,
        options: q.options.map((opt, optIndex) => ({
          text: opt,
          label: String.fromCharCode(65 + optIndex)
        })),
        correctAnswer: q.correctAnswer,
        userAnswer: questionStates[index]?.userAnswer || null,
        isCorrect: questionStates[index]?.userAnswer === q.correctAnswer
      })),
      score: finalScore,
      totalQuestions: questions.length,
      courseName: courses.find(course => course._id === selectedCourse)?.name || '',
      difficulty: quizDetails.difficulty,
      timestamp: new Date().toISOString()
    };

    // Save quiz data for AI Assistant with proper format
    const aiAssistData = {
      questions: quizData.questions.map(q => ({
        ...q,
        options: q.options.map(opt => ({
          text: opt.text,
          label: opt.label
        }))
      })),
      score: finalScore,
      totalQuestions: questions.length,
      courseName: quizData.courseName,
      difficulty: quizDetails.difficulty,
      timestamp: new Date().toISOString()
    };

    // Save both formats
    localStorage.setItem('quizData', JSON.stringify(aiAssistData));
    localStorage.setItem('lastQuizData', JSON.stringify(aiAssistData));

    // Save quiz result and navigate
    saveQuizResult(finalScore).then(() => {
      // Reset quiz state
      setQuizStarted(false);
      setQuestions([]);
      setCurrentQuestion(0);
      setSelectedAnswer(null);

      // Navigate to results page
      navigate('/quiz-results', { 
        state: quizData,
        replace: true 
      });
    }).catch(error => {
      console.error('Error saving quiz result:', error);
      toast.error('Failed to save quiz result. Please try again.');
    });
  }, [questions, questionStates, courses, selectedCourse, quizDetails.difficulty, calculateFinalScore, saveQuizResult, navigate]);

  const handleGetAIHelp = React.useCallback(() => {
    const courseObj = courses.find(course => course._id === selectedCourse);
    const quizData = {
      questions: questions.map((q, index) => ({
        question: q.question,
        options: q.options.map((opt, optIndex) => ({
          text: opt,
          label: String.fromCharCode(65 + optIndex)
        })),
        correctAnswer: q.correctAnswer,
        userAnswer: questionStates[index]?.userAnswer || null,
        isCorrect: questionStates[index]?.userAnswer === q.correctAnswer
      })),
      score: score,
      totalQuestions: questions.length,
      courseName: courseObj?.name || 'Unknown Course',
      difficulty: quizDetails.difficulty,
      timestamp: new Date().toISOString()
    };
    
    console.log('Setting quiz data in context and localStorage:', quizData);
    // Store in both context and localStorage
    setQuizData(quizData);
    localStorage.setItem('quizData', JSON.stringify(quizData));
    localStorage.setItem('lastQuizData', JSON.stringify(quizData));
    
    // Navigate to AI assist
    navigate('/ai-assist', { replace: true });
  }, [courses, selectedCourse, questions, questionStates, score, quizDetails.difficulty, setQuizData, navigate]);

  const handleNextQuestion = React.useCallback(() => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    updateQuestionState(currentQuestion, { 
      userAnswer: selectedAnswer,
      viewed: true
    });

    if (currentQuestion === questions.length - 1) {
      handleQuizComplete();
    } else {
      setCurrentQuestion(prev => prev + 1);
      const nextState = questionStates[currentQuestion + 1];
      if (nextState?.viewed) {
        setSelectedAnswer(nextState.userAnswer);
        setShowResult(true);
        setTimerActive(false);
      } else {
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(quizDetails.timePerQuestion);
        setTimerActive(true);
      }
    }

    setTimeout(() => {
      isTransitioning.current = false;
    }, 500);
  }, [
    currentQuestion, 
    questions.length, 
    selectedAnswer, 
    questionStates, 
    quizDetails.timePerQuestion, 
    updateQuestionState,
    handleQuizComplete
  ]);

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
        const questionOptions = q.options.map((opt, optIndex) => ({
          text: opt,
          label: String.fromCharCode(65 + optIndex)
        }));

        return {
          question: q.question,
          options: questionOptions,
          correctAnswer: q.correctAnswer,
          userAnswer: questionStates[index]?.userAnswer || null,
          isCorrect: questionStates[index]?.userAnswer === q.correctAnswer
        };
      }),
      score: finalScore,
      totalQuestions: questions.length,
      courseName: courses.find(course => course._id === selectedCourse)?.name || '',
      difficulty: quizDetails.difficulty,
      timestamp: new Date().toISOString()
    };

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
      toast.error('Failed to save quiz result. Please try again.');
    });
  }, [questions, questionStates, courses, selectedCourse, quizDetails.difficulty, calculateFinalScore, saveQuizResult, navigate, setQuizData]);

  const renderQuestion = React.useCallback(() => {
    if (!questions[currentQuestion]) return null;
    
    const currentState = questionStates[currentQuestion] || {
      userAnswer: null,
      timeExpired: false,
      viewed: false,
      timeLeft: quizDetails.timePerQuestion
    };

    return (
      <div className="space-y-6">
        {/* Timer Display */}
        <div className="flex justify-center items-center mb-4">
          <div className={`text-2xl font-bold rounded-full w-16 h-16 flex items-center justify-center transition-colors duration-300
            ${!currentState.viewed && timeLeft <= 5 ? 'text-red-600 animate-pulse bg-red-100 dark:bg-red-900' : 
              !currentState.viewed && timeLeft <= 10 ? 'text-orange-600 bg-orange-100 dark:bg-orange-900' :
              'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800'}`}
          >
            {timeLeft}s
          </div>
        </div>

        {/* Question Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          {/* Question Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Question {currentQuestion + 1} of {questions.length}
            </div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {quizDetails.difficulty}
            </div>
          </div>

          {/* Question Text */}
          <div className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
            {questions[currentQuestion].question}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => {
              const isSelected = selectedAnswer === String.fromCharCode(65 + index);
              const isCorrect = String.fromCharCode(65 + index) === questions[currentQuestion].correctAnswer;
              const showCorrect = currentState.viewed && isCorrect;
              const showIncorrect = currentState.viewed && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(String.fromCharCode(65 + index))}
                  disabled={currentState.viewed}
                  className={`w-full p-4 rounded-lg text-left transition-all duration-200 flex items-center
                    ${showCorrect
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ring-2 ring-green-500'
                      : showIncorrect
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 ring-2 ring-red-500'
                      : isSelected
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500'
                      : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    } ${currentState.viewed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="mr-3 font-medium">{option}</span>
                  {showCorrect && <CheckCircle className="w-5 h-5 text-green-600 ml-2" />}
                  {showIncorrect && <XCircle className="w-5 h-5 text-red-600 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            className={`px-4 py-2 rounded-lg flex items-center justify-center space-x-2 ${
              currentQuestion === 0
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleQuizComplete}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              Finish Quiz
              <CheckCircle className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer && !currentState.viewed}
              className={`px-4 py-2 rounded-lg flex items-center ${
                !selectedAnswer && !currentState.viewed
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
        <button
          onClick={handleGetAIHelp}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          Get AI Help
        </button>
      </div>
    );
  }, [
    questions,
    currentQuestion,
    questionStates,
    timeLeft,
    quizDetails.difficulty,
    quizDetails.timePerQuestion,
    selectedAnswer,
    handleAnswerSelect,
    handlePreviousQuestion,
    handleNextQuestion,
    handleQuizComplete,
    handleGetAIHelp
  ]);

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
    const courses = new Set(formattedQuizHistory.map(quiz => quiz.courseName));
    return Array.from(courses);
  }, [formattedQuizHistory]);

  const filteredAndSortedHistory = useMemo(() => {
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

  const getLatestPerformance = () => {
    if (formattedQuizHistory.length === 0) return null;
    
    const latestQuiz = formattedQuizHistory.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    return {
      ...latestQuiz,
      performanceLevel: latestQuiz.successRate >= 80 ? 'Excellent' 
        : latestQuiz.successRate >= 60 ? 'Good'
        : latestQuiz.successRate >= 40 ? 'Fair'
        : 'Needs Improvement',
      performanceColor: latestQuiz.successRate >= 80 ? 'text-green-500 dark:text-green-400' 
        : latestQuiz.successRate >= 60 ? 'text-blue-500 dark:text-blue-400'
        : latestQuiz.successRate >= 40 ? 'text-yellow-500 dark:text-yellow-400'
        : 'text-red-500 dark:text-red-400',
      timeTaken: latestQuiz.timeSpent ? `${Math.floor(latestQuiz.timeSpent / 60)}m ${latestQuiz.timeSpent % 60}s` : 'N/A'
    };
  };

  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
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
                  <Pie data={quizzesPerCourseData} options={pieOptions} />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10.5c0-.28.22-.5.5-.5h7c.28 0 .5.22.5.5v3c0 .28-.22.5-.5.5h-7c-.28 0-.5-.22-.5-.5v-3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.5v3M12 14.5v3" />
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
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

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={quizDetails.difficulty}
                    onChange={(e) => setQuizDetails(prev => ({
                      ...prev,
                      difficulty: e.target.value
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
                      onClick={() => {
                        setShowHistory(!showHistory);
                        if (!showHistory && !historyFetched) {
                          fetchQuizHistory();
                        }
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 ease-in-out"
                    >
                      <History className="w-5 h-5" />
                      <span>{showHistory ? 'Hide History' : 'View History'}</span>
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total Quizzes</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {quizStats.totalQuizzes}
                          </p>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                          <ClipboardList className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {quizStats.averageScore}%
                          </p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Latest Performance</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {quizStats.latestScore}%
                          </p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                          <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable History Section */}
                  {showHistory && (
                    <div className="mt-6">
                      {/* Filter and Sort Controls */}
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
                            <div
                              key={attempt.id}
                              className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} p-4 rounded-lg hover:shadow-md transition-shadow`}
                            >
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
                                        attempt.successRate >= 70 ? 'text-green-500' : 
                                        attempt.successRate >= 50 ? 'text-yellow-500' : 
                                        'text-red-500'
                                      }`}>
                                        {attempt.successRate}% Success Rate
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

          {showHistory && (
            <QuizHistoryModal />
          )}
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

  if (currentQuestion >= questions.length && questions.length > 0) {
    const finalScore = calculateFinalScore();
    const scorePercentage = (finalScore / questions.length) * 100;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className={`container mx-auto px-4 py-8`}
      >
        <div className={`max-w-2xl mx-auto bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-xl shadow-lg p-8`}>
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            Quiz Completed!
          </h2>

          <div className="text-center mb-8">
            <div className="inline-block p-4 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-4">
              <Award className="w-12 h-12 text-indigo-600 dark:text-indigo-300" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Your Score: {finalScore}/{questions.length}</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {scorePercentage}% Correct
            </p>
          </div>

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className={`min-h-screen bg-${themeConfig.colors.background.page.light} dark:bg-${themeConfig.colors.background.page.dark} py-4 px-4 sm:px-6 lg:px-8 backdrop-blur-md`}
    >
      <div className="max-w-3xl mx-auto">
        <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} shadow-lg rounded-lg overflow-hidden`}>
          {/* Header */}
          <div className={`p-6 bg-${themeConfig.colors.primary.bg.light} dark:bg-${themeConfig.colors.primary.bg.dark}`}>
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <Book className="h-8 w-8 text-white" />
                <h1 className="ml-3 text-2xl font-bold text-white">Quiz</h1>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="p-6">
            {showResult && currentQuestion === questions.length - 1 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quiz Results</h2>
                </div>
                <div className="text-center mt-8">
                  <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
                  <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg p-6 shadow-lg`}>
                    <div className="text-4xl font-bold mb-4">
                      {score} / {questions.length}
                    </div>
                    <div className="text-lg mb-6">
                      {getResultMessage(score, questions.length)}
                    </div>
                    {renderResultActions()}
                  </div>
                </div>
              </div>
            ) : (
              renderQuestion()
            )}
          </div>
        </div>
      </div>
      {showHistory && (
        <QuizHistoryModal />
      )}
      <div className="p-6">
        <div className="mb-8 bg-white shadow-md rounded-lg p-4">
          <h1 className="text-2xl font-bold mb-4 text-center">Quiz Scores</h1>
          <Bar data={correctVsWrongData} options={barOptions} />
        </div>
        <div className="mb-8 bg-white shadow-md rounded-lg p-4">
          <h1 className="text-2xl font-bold mb-4">Correct & Wrong Answers</h1>
          <div className="h-[350px]" style={{ transform: 'translateX(100px)' }}>
            <Pie data={successRateData} options={pieOptions} />
          </div>
        </div>
        <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} shadow-md rounded-lg p-4`}>
          <h1 className="text-2xl font-bold mb-4">Number of Quizzes Taken</h1>
          <div className="h-[350px]" style={{ transform: 'translateX(100px)' }}>
            <Pie data={quizzesPerCourseData} options={pieOptions} />
          </div>
        </div>
        <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} shadow-md rounded-lg p-4`}>
          <h1 className="text-2xl font-bold mb-4">Difficulty Levels</h1>
          <Bar data={quizzesPerCourseData} options={barOptions} />
        </div>
        <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} shadow-md rounded-lg p-4`}>
          <h1 className="text-2xl font-bold mb-4">Time-Based Performance</h1>
          <Bar data={quizzesPerCourseData} options={barOptions} />
        </div>
      </div>
      {getLatestPerformance() && (
        <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} shadow-md rounded-lg p-4`}>
          <h1 className="text-2xl font-bold mb-4">Latest Performance</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-white/5 dark:bg-gray-800/5 backdrop-blur-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Course</h3>
              <p className="mt-1 text-lg font-semibold">{getLatestPerformance()?.courseName}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 dark:bg-gray-800/5 backdrop-blur-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Score</h3>
              <p className="mt-1 text-lg font-semibold">
                {getLatestPerformance()?.score} / {getLatestPerformance()?.totalQuestions}
                <span className="text-sm ml-2">({getLatestPerformance()?.successRate}%)</span>
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 dark:bg-gray-800/5 backdrop-blur-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Performance Level</h3>
              <p className={`mt-1 text-lg font-semibold ${getLatestPerformance()?.performanceColor}`}>
                {getLatestPerformance()?.performanceLevel}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 dark:bg-gray-800/5 backdrop-blur-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Taken</h3>
              <p className="mt-1 text-lg font-semibold">{getLatestPerformance()?.timeTaken}</p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-white/5 dark:bg-gray-800/5 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</h3>
              <span className="text-sm font-medium">{getLatestPerformance()?.successRate}%</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  getLatestPerformance()?.successRate >= 80 ? 'bg-green-500' 
                  : getLatestPerformance()?.successRate >= 60 ? 'bg-blue-500'
                  : getLatestPerformance()?.successRate >= 40 ? 'bg-yellow-500'
                  : 'bg-red-500'
                }`}
                style={{ width: `${getLatestPerformance()?.successRate}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Quiz;