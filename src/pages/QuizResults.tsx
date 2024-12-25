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
  const percentage = (score / totalQuestions) * 100;

  const getMessage = () => {
    if (percentage >= 90) return "Outstanding! You've mastered this topic! 🌟";
    if (percentage >= 80) return "Excellent work! You have a strong grasp of the material! 💪";
    if (percentage >= 70) return "Good job! Keep up the great work! 👍";
    if (percentage >= 60) return "Nice effort! A bit more practice will help you improve! 📚";
    return "Keep learning! Every attempt brings you closer to mastery! 💡";
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
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
          
          {/* Content */}
          <div className="relative">
            <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
              Quiz Results
            </h1>

            {/* Score Display */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <svg className="w-32 h-32">
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
                    className="text-indigo-600 dark:text-indigo-400"
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="58"
                    cx="64"
                    cy="64"
                    strokeDasharray={`${percentage * 3.64} 364`}
                    transform="rotate(-90 64 64)"
                  />
                </svg>
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">
                  {Math.round(percentage)}%
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
                    <p className="text-lg font-semibold">{score} / {totalQuestions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Book className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Course</p>
                    <p className="text-lg font-semibold">{courseName || 'General Quiz'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Difficulty</p>
                    <p className="text-lg font-semibold">{difficulty}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="text-center mb-8">
              <p className="text-xl font-medium text-gray-700 dark:text-gray-300">
                {getMessage()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleTryAgain}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Try Another Quiz
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetAIHelp}
                className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
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
