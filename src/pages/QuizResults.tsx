import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Book, MessageSquare, ChevronLeft, CheckCircle, XCircle, ArrowUp, AlertCircle, Info, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuiz } from '../context/QuizContext';
import type { QuizData } from '../context/QuizContext';
import { toast } from 'react-hot-toast';

const QuizResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { quizData: contextQuizData, setQuizData } = useQuiz();
  const quizData = (location.state as QuizData) || contextQuizData;
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions'>('overview');
  const [showStrengths, setShowStrengths] = useState(false);
  const [showWeaknesses, setShowWeaknesses] = useState(false);

  React.useEffect(() => {
    // If no quiz data or not authenticated, redirect to quiz page
    if (!quizData || !isAuthenticated) {
      navigate('/quiz', { replace: true });
    }
  }, [quizData, isAuthenticated, navigate]);

  if (!quizData || !isAuthenticated) {
    return null;
  }

  const { score, totalQuestions, courseName, difficulty, questions } = quizData;
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
    console.log("handleGetAIHelp called in QuizResults - preparing quiz data for AI assist");
    
    // Try to get quiz data from multiple sources for reliability
    let quizDataToUse = null;
    
    // First try context
    if (quizData) {
      console.log("Using quiz data from context");
      quizDataToUse = quizData;
    } 
    // Then try location state
    else if (location.state) {
      console.log("Using quiz data from location state");
      quizDataToUse = location.state;
    }
    // Then try localStorage
    else {
      try {
        const storedData = localStorage.getItem('lastQuizData');
        if (storedData) {
          console.log("Using quiz data from localStorage (lastQuizData)");
          quizDataToUse = JSON.parse(storedData);
        }
      } catch (error) {
        console.error("Error parsing quiz data from localStorage:", error);
      }
    }
    
    // Final fallback check
    if (!quizDataToUse) {
      console.error("No quiz data available for AI help from any source");
      toast.error("Error: No quiz data available. Please take a quiz first.");
      return;
    }
    
    // Create a deep copy of the quiz data to ensure we don't modify the original
    const quizDataCopy = JSON.parse(JSON.stringify(quizDataToUse));
    
    // Generate a unique ID for this quiz data to prevent infinite processing loops
    const quizDataId = `${quizDataCopy.courseName}-${quizDataCopy.score}-${quizDataCopy.totalQuestions}-${Date.now()}`;
    quizDataCopy.id = quizDataId;
    
    // Check if this quiz has been processed already
    const processedQuizzes = JSON.parse(localStorage.getItem('processedQuizzes') || '[]');
    const isProcessed = processedQuizzes.some((id: string) => 
      id.startsWith(`${quizDataCopy.courseName}-${quizDataCopy.score}-${quizDataCopy.totalQuestions}`)
    );
    
    if (isProcessed) {
      console.log("This quiz has already been processed, removing old data first");
      // Clear all existing quiz data to prevent reprocessing
      localStorage.removeItem('quizData');
      localStorage.removeItem('lastQuizData');
      sessionStorage.removeItem('quizData');
      
      // Small delay to ensure storage is cleared
      setTimeout(() => {
        storeAndNavigate(quizDataCopy, quizDataId, processedQuizzes);
      }, 100);
    } else {
      storeAndNavigate(quizDataCopy, quizDataId, processedQuizzes);
    }
  };
  
  // Helper function to store quiz data and navigate
  const storeAndNavigate = (
    quizDataCopy: QuizData, 
    quizDataId: string, 
    processedQuizzes: string[]
  ) => {
    // Log the quiz data we're about to set
    console.log('Setting quiz data in context and localStorage:', quizDataCopy);
    
    // Ensure the data is properly stored in both context and localStorage
    setQuizData(quizDataCopy);
    
    try {
      // Use more reliable JSON stringification
      const jsonString = JSON.stringify(quizDataCopy);
      
      // Store in both 'quizData' and 'lastQuizData' for redundancy
      localStorage.setItem('quizData', jsonString);
      localStorage.setItem('lastQuizData', jsonString);
      console.log('Quiz data saved to localStorage:', jsonString.substring(0, 100) + '...');
      
      // For even more reliability, also save to sessionStorage
      sessionStorage.setItem('quizData', jsonString);
      console.log('Quiz data also saved to sessionStorage for redundancy');
      
      // Mark this quiz as processed to prevent reprocessing
      if (!processedQuizzes.includes(quizDataId)) {
        processedQuizzes.push(quizDataId);
        localStorage.setItem('processedQuizzes', JSON.stringify(processedQuizzes));
      }
    } catch (error) {
      console.error('Error saving quiz data to storage:', error);
      toast.error("Failed to save quiz data. Please try again.");
      return;
    }
    
    // Add a small delay to ensure the data is properly set before navigating
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
    }, 300); // Increased timeout for reliability
  };

  const toggleQuestion = (index: number) => {
    if (expandedQuestion === index) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(index);
    }
  };

  // Calculate strengths and weaknesses
  const getStrengthsAndWeaknesses = () => {
    if (!questions) return { strengths: [], weaknesses: [] };

    interface QuestionItem {
      index: number;
      question: typeof questions[0];
    }

    const categorizedQuestions = questions.reduce((acc, question, index) => {
      if (question.isCorrect) {
        acc.strengths.push({ index, question });
      } else {
        acc.weaknesses.push({ index, question });
      }
      return acc;
    }, { strengths: [], weaknesses: [] } as { strengths: QuestionItem[], weaknesses: QuestionItem[] });

    return categorizedQuestions;
  };

  const { strengths, weaknesses } = getStrengthsAndWeaknesses();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 dark:bg-indigo-700 p-4 text-white flex justify-between items-center">
            <button 
              onClick={() => navigate('/quiz')}
              className="flex items-center text-white hover:text-indigo-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              <span>Back to Quiz</span>
            </button>
            <div>
              <h2 className="text-xl font-bold">Quiz Results</h2>
            </div>
            <div>
              <span className="text-sm opacity-90">Course: {courseName || 'General Quiz'}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Performance Overview
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'questions'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Question Review
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Performance Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Score Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="md:col-span-1 flex justify-center">
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
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">
                        {formatScore(percentage)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                      {getMessage()}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                        <div className="flex items-center">
                          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
                            <div className="font-semibold">{score} / {totalQuestions} correct</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                        <div className="flex items-center">
                          <Book className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Difficulty</div>
                            <div className="font-semibold">{difficulty}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strengths and Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Strengths */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                    <div 
                      className="p-4 cursor-pointer flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded-t-lg"
                      onClick={() => setShowStrengths(!showStrengths)}
                    >
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" />
                        <h4 className="font-semibold">Your Strengths</h4>
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform ${showStrengths ? 'rotate-180' : ''}`} />
                    </div>
                    
                    <AnimatePresence>
                      {showStrengths && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4">
                            {strengths.length > 0 ? (
                              <ul className="space-y-2">
                                {strengths.slice(0, 3).map(({ index, question }) => (
                                  <li key={index} className="text-sm">
                                    <div className="flex">
                                      <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                                      <span className="line-clamp-2">{question.question}</span>
                                    </div>
                                  </li>
                                ))}
                                {strengths.length > 3 && (
                                  <li className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
                                    + {strengths.length - 3} more correct answers
                                  </li>
                                )}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                Keep practicing to develop strengths in this area.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Weaknesses */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                    <div 
                      className="p-4 cursor-pointer flex justify-between items-center bg-red-50 dark:bg-red-900/20 rounded-t-lg"
                      onClick={() => setShowWeaknesses(!showWeaknesses)}
                    >
                      <div className="flex items-center">
                        <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
                        <h4 className="font-semibold">Areas to Improve</h4>
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform ${showWeaknesses ? 'rotate-180' : ''}`} />
                    </div>
                    
                    <AnimatePresence>
                      {showWeaknesses && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4">
                            {weaknesses.length > 0 ? (
                              <ul className="space-y-2">
                                {weaknesses.slice(0, 3).map(({ index, question }) => (
                                  <li key={index} className="text-sm">
                                    <div className="flex">
                                      <span className="text-red-500 dark:text-red-400 mr-2">✗</span>
                                      <span className="line-clamp-2">{question.question}</span>
                                    </div>
                                  </li>
                                ))}
                                {weaknesses.length > 3 && (
                                  <li className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
                                    + {weaknesses.length - 3} more areas to improve
                                  </li>
                                )}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                Great job! You answered all questions correctly.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Learning Tips */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-8">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-2">Learning Tips</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {percentage >= 80 
                          ? "Excellent work! To further master this subject, try explaining these concepts to someone else - teaching is one of the best ways to solidify your understanding."
                          : percentage >= 60
                          ? "Good progress! Focus on reviewing the questions you missed and try to understand why the correct answer is right. Consider creating flashcards for concepts you struggled with."
                          : "Keep going! Try breaking down the subject into smaller parts and master each section before moving on. Schedule regular review sessions and consider getting additional learning resources."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Question Review Tab */}
            {activeTab === 'questions' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-indigo-500" />
                  Review All Questions
                </h3>
                
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg mb-4 flex items-center text-sm">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2 flex-shrink-0" />
                  <p>Click on each question to see details and the correct answer.</p>
                </div>
                
                <div className="space-y-3">
                  {questions?.map((question, index) => (
                    <motion.div 
                      key={index}
                      initial={false}
                      layoutId={`question-${index}`}
                      className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm"
                    >
                      <motion.div 
                        className={`p-4 flex justify-between items-center cursor-pointer ${
                          question.isCorrect 
                            ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' 
                            : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                        } transition-colors`}
                        onClick={() => toggleQuestion(index)}
                      >
                        <div className="flex items-center">
                          {question.isCorrect 
                            ? <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" /> 
                            : <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0" />
                          }
                          <div className="font-medium line-clamp-1 pr-2">{question.question}</div>
                        </div>
                        <motion.div 
                          className="flex items-center text-sm"
                          animate={{ rotate: expandedQuestion === index ? 180 : 0 }}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </motion.div>
                      </motion.div>
                      
                      <AnimatePresence>
                        {expandedQuestion === index && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-base mb-3">{question.question}</p>
                              
                              <div className="space-y-2 mb-3">
                                {question.options.map((option, optIndex) => {
                                  const optionText = typeof option === 'string' ? option : option.text;
                                  const optionLabel = typeof option === 'string' ? String.fromCharCode(65 + optIndex) : option.label;
                                  const isCorrectOption = question.correctAnswer === optionLabel;
                                  const isSelectedOption = question.userAnswer === optionLabel;
                                  
                                  let className = "p-2 border rounded flex items-center text-sm transition-colors";
                                  
                                  if (isCorrectOption) {
                                    className += " bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700";
                                  } else if (isSelectedOption) {
                                    className += " bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700";
                                  }
                                  
                                  return (
                                    <div key={optIndex} className={className}>
                                      <div className="flex-1">
                                        <span className="font-bold mr-2">{optionLabel}.</span> {optionText}
                                      </div>
                                      
                                      {isCorrectOption && (
                                        <div className="text-green-600 dark:text-green-400 flex items-center text-xs">
                                          <span>Correct</span>
                                        </div>
                                      )}
                                      
                                      {isSelectedOption && !isCorrectOption && (
                                        <div className="text-red-600 dark:text-red-400 text-xs">
                                          <span>Your answer</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {!question.isCorrect && (
                                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                  <div className="flex items-start">
                                    <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-2 flex-shrink-0" />
                                    <div>
                                      <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-1">
                                        Correct answer: {question.correctAnswer}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Try to understand why this is the correct answer. Review related concepts in your course materials.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <button
                onClick={handleTryAgain}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:ring-4 focus:ring-indigo-300"
              >
                Take Another Quiz
              </button>
              
              <button
                onClick={handleGetAIHelp}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:ring-4 focus:ring-purple-300 flex items-center"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Get AI Help
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuizResults;
