import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Award, Target, Calendar } from 'lucide-react';
import axios from 'axios';

interface QuizHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface QuizAttempt {
  _id: string;
  courseName: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
  difficulty: string;
  timeSpent: number;
  improvement: number;
}

const QuizHistoryModal: React.FC<QuizHistoryModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalQuizzes, setTotalQuizzes] = useState(0);

  useEffect(() => {
    const fetchQuizHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch quiz history and total count from our backend API
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/quiz-history/${userId}`);
        
        if (response.data) {
          setQuizHistory(response.data.history);
          setTotalQuizzes(response.data.totalQuizzes);
        }
      } catch (err) {
        setError('Failed to fetch quiz history. Please try again later.');
        console.error('Error fetching quiz history:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchQuizHistory();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-xl w-full max-w-3xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-700/50 p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Quiz Performance History</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats Section */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Quizzes</p>
                    <p className="text-2xl font-bold text-white">{totalQuizzes}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              {totalQuizzes > 0 && (
                <>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Average Score</p>
                        <p className="text-2xl font-bold text-white">
                          {(quizHistory.reduce((acc, quiz) => acc + (quiz.score / quiz.totalQuestions * 100), 0) / quizHistory.length).toFixed(1)}%
                        </p>
                      </div>
                      <Award className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Latest Score</p>
                        <p className="text-2xl font-bold text-white">
                          {quizHistory[0] ? `${(quizHistory[0].score / quizHistory[0].totalQuestions * 100).toFixed(1)}%` : 'N/A'}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-4">{error}</div>
            ) : quizHistory.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No quiz attempts found. Start taking quizzes to build your history!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quizHistory.map((attempt) => (
                  <motion.div
                    key={attempt._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Column */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">
                          {attempt.courseName}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-400">
                            <Award className="w-4 h-4 mr-2" />
                            <span>Score: {attempt.score}/{attempt.totalQuestions}</span>
                          </div>
                          <div className="flex items-center text-gray-400">
                            <Target className="w-4 h-4 mr-2" />
                            <span>Difficulty: {attempt.difficulty}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div>
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-400">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Date: {format(new Date(attempt.timestamp), 'PPp')}</span>
                          </div>
                          <div className="flex items-center text-gray-400">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>Time per Question: {Math.round(attempt.timeSpent / attempt.totalQuestions)}s</span>
                          </div>
                          {attempt.improvement && (
                            <div className="flex items-center">
                              <span className={`text-sm ${attempt.improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {attempt.improvement > 0 ? '+' : ''}{attempt.improvement}% from previous attempt
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuizHistoryModal;
