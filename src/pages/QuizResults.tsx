import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Clock, Book, ArrowLeft, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuiz } from '../context/QuizContext';
import type { QuizData } from '../context/QuizContext';

const QuizResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { quizData: contextQuizData, setQuizData } = useQuiz();
  const quizData = (location.state as QuizData) || contextQuizData;

  React.useEffect(() => {
    // If no quiz data or not authenticated, redirect to quiz page
    if (!quizData || !isAuthenticated) {
      navigate('/quiz', { replace: true });
    }
  }, [quizData, isAuthenticated, navigate]);

  if (!quizData || !isAuthenticated) {
    return null;
  }

  const { score, totalQuestions, courseName, difficulty } = quizData;
  const percentage = ((score / totalQuestions) * 100);

  const formatScore = (score: number) => {
    return Math.floor(score) + '%';
  };

  const getScoreColor = (score: number) => {
    const roundedScore = Math.floor(score);
    if (roundedScore >= 80) return 'text-emerald-500';
    if (roundedScore >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getMessage = () => {
    const percentageNum = Math.floor(percentage);
    if (percentageNum >= 90) return "Outstanding! You've mastered this topic! 🌟";
    if (percentageNum >= 80) return "Excellent work! You have a strong grasp of the material! 💪";
    if (percentageNum >= 70) return "Good job! Keep up the great work! 👍";
    if (percentageNum >= 60) return "You're making progress! A bit more practice will help! 📚";
    return "Keep practicing! You'll get better with time! 💪";
  };

  const handleTryAgain = () => {
    setQuizData(null);
    navigate('/quiz', { replace: true });
  };

  const handleGetAIHelp = () => {
    // Ensure quiz data is in context and localStorage
    setQuizData(quizData);
    localStorage.setItem('quizData', JSON.stringify(quizData));
    navigate('/ai-assist', { replace: true });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 py-6 px-3 sm:py-8 sm:px-4"
    >
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
          
          {/* Content */}
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
              Quiz Results
            </h1>

            {/* Score Display with improved sizing */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative">
                <svg className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
                  <circle
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="58"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className={`${getScoreColor(percentage)}`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="58"
                    cx="64"
                    cy="64"
                    strokeDasharray={`${Math.floor(percentage) * 3.64} 364`}
                    transform="rotate(-90 64 64)"
                  />
                </svg>
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg sm:text-xl md:text-2xl font-bold">
                  {formatScore(percentage)}
                </span>
              </div>
            </div>

            {/* Message moved up for better flow */}
            <div className="text-center mb-4 sm:mb-6">
              <p className="text-base sm:text-lg md:text-xl font-medium text-gray-700 dark:text-gray-300 px-2">
                {getMessage()}
              </p>
            </div>

            {/* Details Grid with improved responsiveness */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Score</p>
                    <p className="text-sm sm:text-lg font-semibold">{formatScore(percentage)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                    <Book className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="w-full overflow-hidden">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Course</p>
                    <p className="text-sm sm:text-lg font-semibold truncate" title={courseName || 'General Quiz'}>
                      {courseName || 'General Quiz'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Difficulty</p>
                    <p className="text-sm sm:text-lg font-semibold">{difficulty}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons with improved responsiveness */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleTryAgain}
                className="w-full sm:w-auto flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Try Another Quiz
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGetAIHelp}
                className="w-full sm:w-auto flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Get AI Help
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuizResults;
