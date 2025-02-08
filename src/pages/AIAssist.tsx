import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../config/axios';
import { MessageSquare, Send, Bot, User, Sparkles, Loader2, History, Trash2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { format } from 'date-fns';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatHistory {
  _id: string;
  messages: Message[];
  createdAt: string;
  type: 'quiz_review' | 'general';
  metadata: {
    courseName: string;
    quizScore: number;
    totalQuestions: number;
  };
}

interface QuizData {
  courseName: string;
  difficulty: string;
  score: number;
  totalQuestions: number;
  questions: {
    question: string;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    options: {
      label: string;
      text: string;
    }[];
  }[];
}

const AIAssist: React.FC = () => {
  const { quizData, setQuizData } = useQuiz();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuizData, setCurrentQuizData] = useState<{
    score?: string;
    totalQuestions?: number;
    courseName?: string;
    correctQuestions?: number[];
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token') !== null;

  // Check if this is a new session and reset data if needed
  useEffect(() => {
    const lastUserId = localStorage.getItem('lastUserId');
    const currentToken = localStorage.getItem('token');
    
    if (currentToken) {
      try {
        const tokenData = JSON.parse(atob(currentToken.split('.')[1]));
        const currentUserId = tokenData.id;
        
        // If this is a different user or new user, reset everything
        if (lastUserId !== currentUserId) {
          // Clear all AI assist related data
          localStorage.removeItem('aiAssistMessages');
          localStorage.removeItem('quiz_data');
          localStorage.removeItem('quizData');
          setMessages([]);
          setQuizData(null);
          setCurrentQuizData(null);
          
          // Store the new user ID
          localStorage.setItem('lastUserId', currentUserId);
        }
      } catch (error) {
        console.error('Error processing token:', error);
      }
    }
  }, [setQuizData]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Reset messages and show welcome message on login
    const welcomeMessage = {
      role: 'assistant' as const,
      content: `# 👋 Welcome to Epsilora AI! ✨

I'm your personal AI assistant, ready to help you learn and grow! 🌱

Here's what I can do for you:
* 📚 Answer your questions about any topic
* 🧠 Help you understand complex concepts
* 💡 Provide study tips and strategies
* 🎯 Guide you through problem-solving

Feel free to ask me anything - I'm here to support your learning journey! 🚀`
    };

    setMessages([welcomeMessage]);
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (quizData) {
      const loadQuizSummary = async () => {
        const summary = await generateQuizSummary(quizData);
        const updatedMessages = [...messages, { role: 'assistant' as const, content: summary }];
        setMessages(updatedMessages);
      };
      loadQuizSummary();
    }
  }, [quizData]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aiAssistMessages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      localStorage.removeItem('aiAssistMessages');
    };
  }, []);

  useEffect(() => {
    // Update quiz data whenever messages change
    const quizMessage = messages.find(msg => msg.content.includes('Quiz Review'));
    if (quizMessage) {
      setCurrentQuizData(parseQuizReview(quizMessage.content));
    } else {
      setCurrentQuizData(null);
    }
  }, [messages]);

  const parseQuizReview = (content: string) => {
    const scoreMatch = content.match(/🏆 Score: (\d+)\/(\d+)/);
    const courseMatch = content.match(/📘 Course: (.*?)\n/);
    const correctQuestions = content.split('\n')
      .filter(line => line.includes('Question'))
      .map((line, index) => line.includes('✅') ? index + 1 : 0)
      .filter(num => num !== 0);

    return {
      score: scoreMatch ? scoreMatch[0] : undefined,
      totalQuestions: scoreMatch ? parseInt(scoreMatch[2]) : undefined,
      courseName: courseMatch ? courseMatch[1] : undefined,
      correctQuestions
    };
  };

  const getExplanation = async (question: any) => {
    try {
      const prompt = `Question: ${question.question}
Options:
${question.options.map(opt => `${opt.label.replace(/[^A-D]/g, '')}. ${opt.text}`).join('\n')}
Correct Answer: ${question.correctAnswer.replace(/[^A-D]/g, '')}

Explain in two clear, concise sentences why this answer is correct. Focus on the specific context and concepts involved.`;

      const response = await axiosInstance.post('/api/chat/ai', {
        message: prompt,
        type: 'quiz_explanation'
      });

      return response.data.message;
    } catch (error) {
      console.error('Error getting explanation:', error);
      return 'Unable to generate explanation.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/api/chat/ai', {
        message: input,
        type: 'general'
      });

      const aiMessage = { role: 'assistant' as const, content: response.data.message };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get response from AI');
    } finally {
      setLoading(false);
    }
  };

  const generateQuizSummary = async (quizData: QuizData) => {
    const { courseName, score, totalQuestions, questions } = quizData;
    const percentage = (score / totalQuestions) * 100;

    let performanceText = '';
    if (percentage >= 90) {
      performanceText = '🌟 Excellent performance!';
    } else if (percentage >= 70) {
      performanceText = '👏 Good job!';
    } else if (percentage >= 50) {
      performanceText = '💪 Keep practicing!';
    } else {
      performanceText = '📚 Let\'s work on improving!';
    }

    return `# Quiz Review: ${courseName}

${performanceText}

## 📊 Score Overview
* 🎯 Score: ${score}/${totalQuestions} (${percentage.toFixed(1)}%)

## 📝 Detailed Question Review

${questions.map((q, index) => `### ${q.isCorrect ? '✅' : '❌'} Question ${index + 1}
${q.question}

${q.options.map(opt => {
  const label = opt.label.replace(/[^A-D]/g, '').replace(/.*([A-D]).*/, '$1');
  const text = opt.text.replace(/^[A-D][.)]?\s*[A-D][.)]?\s*/, '').trim();
  
  const isUserAnswer = label === q.userAnswer.replace(/[^A-D]/g, '');
  const isCorrectAnswer = label === q.correctAnswer.replace(/[^A-D]/g, '');
  
  let marker = '';
  if (isUserAnswer && isCorrectAnswer) {
    marker = '✅';
  } else if (isUserAnswer) {
    marker = '❌';
  } else if (isCorrectAnswer) {
    marker = '✅';
  }
  
  return `${label}. ${text} ${marker}\n`;
}).join('\n')}
---`).join('\n\n')}

## 📈 Key Takeaways
* ${percentage >= 70 ? '🌟' : '💡'} You performed ${percentage >= 70 ? 'well' : 'adequately'} in this quiz
* ✅ Correctly answered: ${score} questions
* ${percentage < 100 ? `❌ Areas to review: ${questions.filter(q => !q.isCorrect).length} questions` : '🏆 Perfect score!'}

Would you like me to explain any specific questions in more detail? I'm here to help! 🤓`;
  };

  const StyledComponents = {
    MainTitle: (text: string) => `# ${text}`,
    SectionTitle: (text: string) => `## ${text}`,
    SubSection: (text: string) => `### ${text}`,
    Question: (text: string) => `#### ${text}`,
    HighlightCorrect: (text: string) => `**${text}**`,
    HighlightIncorrect: (text: string) => `**${text}**`,
    Separator: () => `---`,
    ListItem: (text: string) => `- ${text}`,
    NumberedItem: (num: number, text: string) => `${num}. ${text}`,
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 relative">
          {/* Main Chat Area */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Chat Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">AI Learning Assistant</h2>
                    <p className="text-indigo-100 text-sm mt-1">Powered by advanced AI to help you learn</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-[calc(100vh-20rem)] overflow-y-auto p-6 space-y-8 bg-gray-50/50 dark:bg-gray-900/50">
              <AnimatePresence initial={false}>
                {Array.isArray(messages) && messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 40,
                      mass: 1
                    }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex items-start max-w-3xl space-x-4">
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          mass: 1,
                          delay: 0.1 
                        }}
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          message.role === 'user'
                            ? 'bg-indigo-100 dark:bg-indigo-900/50'
                            : 'bg-purple-100 dark:bg-purple-900/50'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        )}
                      </motion.div>
                      <motion.div
                        initial={{ x: message.role === 'user' ? 20 : -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          mass: 1,
                          delay: 0.15 
                        }}
                        className={`rounded-2xl p-6 shadow-md ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                        }`}
                      >
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({children}) => (
                              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">
                                {children}
                              </h1>
                            ),
                            h2: ({children}) => (
                              <h2 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400 mb-6">
                                {children}
                              </h2>
                            ),
                            h3: ({children}) => (
                              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                {children}
                              </h3>
                            ),
                            p: ({children}) => (
                              <p className="mb-4 leading-relaxed">
                                {children}
                              </p>
                            ),
                            ul: ({children}) => (
                              <ul className="mb-4 space-y-2">
                                {children}
                              </ul>
                            ),
                            li: ({children}) => (
                              <li className="flex items-start space-x-2">
                                <span className="text-indigo-500 dark:text-indigo-400">•</span>
                                <span>{children}</span>
                              </li>
                            ),
                            code: ({inline, children}) => (
                              inline ? (
                                <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono">
                                  {children}
                                </code>
                              ) : (
                                <pre className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-x-auto">
                                  <code className="text-sm font-mono">
                                    {children}
                                  </code>
                                </pre>
                              )
                            )
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Chat Input */}
            <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSubmit} className="flex items-center space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIAssist;
