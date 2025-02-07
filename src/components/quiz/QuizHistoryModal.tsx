import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Award, Target, Calendar } from 'lucide-react';
import axiosInstance from '../../utils/axios';

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

interface QuizStats {
  totalQuizzes: number;
  averageScore: number;
  latestScore: number;
}

const QuizHistoryModal: React.FC<QuizHistoryModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<QuizStats>({
    totalQuizzes: 0,
    averageScore: 0,
    latestScore: 0
  });

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching quiz history...');
        const historyResponse = await axiosInstance.get(`/api/quiz-history/${userId}`);
        const statsResponse = await axiosInstance.get(`/api/quiz-stats/${userId}`);
        
        console.log('Quiz history raw response:', historyResponse.data);
        console.log('Quiz stats response:', statsResponse.data);

        if (historyResponse.data && statsResponse.data) {
          setQuizHistory(historyResponse.data.history);
          setStats({
            totalQuizzes: statsResponse.data.totalQuizzes,
            averageScore: statsResponse.data.averageScore,
            latestScore: statsResponse.data.latestScore
          });
        }
      } catch (err) {
        setError('Failed to fetch quiz data. Please try again later.');
        console.error('Error fetching quiz history:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchQuizData();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const formatPercentage = (value: number) => {
    return Math.floor(value) + '%';
  };

  const formatImprovement = (value: number) => {
    const improvedValue = Math.floor(value);
    if (improvedValue > 0) {
      return `+${improvedValue}%`;
    }
    return `${improvedValue}%`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
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
                    <p className="text-2xl font-bold text-white">{stats.totalQuizzes}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Average Score</p>
                    <p className="text-2xl font-bold text-white">
                      {formatPercentage(stats.averageScore)}
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Latest Performance</p>
                    <p className="text-2xl font-bold text-white">
                      {formatPercentage(stats.latestScore)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>
          </div>

          {/* History List */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="text-center text-gray-400">Loading quiz history...</div>
            ) : error ? (
              <div className="text-center text-red-400">{error}</div>
            ) : quizHistory.length === 0 ? (
              <div className="text-center text-gray-400">No quiz attempts yet</div>
            ) : (
              <div className="space-y-4">
                {quizHistory.map((attempt) => (
                  <div
                    key={attempt._id}
                    className="bg-gray-800/30 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-medium">{attempt.courseName}</h3>
                        <p className="text-gray-400 text-sm">
                          Score: {formatPercentage(attempt.score)} • {attempt.difficulty}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(attempt.timestamp), 'MMM d, yyyy HH:mm')}
                          <Clock className="w-3 h-3 ml-2" />
                          {Math.round(attempt.timeSpent / 60)} min
                        </div>
                      </div>
                      {attempt.improvement > 0 && (
                        <span className="text-green-400 text-sm">
                          {formatImprovement(attempt.improvement)}
                        </span>
                      )}
                    </div>
                  </div>
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
