import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../config/axios';
import axios from 'axios';
import { MessageSquare, Send, Bot, User, Sparkles, Loader2, History, Trash2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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

const WELCOME_MESSAGE = {
  role: 'assistant' as const,
  content: `# ✨ Hello! I'm Your AI Learning Partner

### 🎯 What I Can Help You With:
* 📚 **Course Material** - Explain concepts, review topics
* 💡 **Learning Support** - Study tips, exam prep
* 🔄 **Quiz Review** - Analyze mistakes, improve understanding
* 🎮 **Practice** - Interactive learning exercises

💪 **Let's make learning fun and effective! Ask me anything.**`
};

const AIAssist: React.FC = () => {
  const { quizData, setQuizData } = useQuiz();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
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

  const cleanupChat = () => {
    const hasQuizData = localStorage.getItem('quizData');
    if (!hasQuizData) {
      setMessages([WELCOME_MESSAGE]);
      setQuizData(null);
      setCurrentQuizData(null);
      localStorage.removeItem('aiAssistMessages');
    }
    // Don't remove quizData from localStorage here
    localStorage.removeItem('lastUserId');
  };

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        cleanupChat();
        navigate('/login');
      }
    };

    checkAuthStatus();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (!e.newValue) {
          cleanupChat();
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate, setQuizData]);

  useEffect(() => {
    const clearChatOnReload = () => {
      const hasQuizData = localStorage.getItem('quizData');
      if (!hasQuizData) {
        // Only clear if there's no quiz data
        setMessages([WELCOME_MESSAGE]);
        setCurrentQuizData(null);
      }
    };

    window.addEventListener('beforeunload', clearChatOnReload);
    return () => {
      window.removeEventListener('beforeunload', clearChatOnReload);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      cleanupChat();
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentUserId = tokenData.id;
      const lastUserId = localStorage.getItem('lastUserId');

      if (lastUserId !== currentUserId) {
        cleanupChat();
        localStorage.setItem('lastUserId', currentUserId);
      }

      // Remove quiz data initialization to prevent it from showing on reload
      setMessages([WELCOME_MESSAGE]);
      
    } catch (error) {
      console.error('Error processing token:', error);
      cleanupChat();
    }
  }, [isAuthenticated, quizData]);

  // Add effect to handle quiz data transitions
  useEffect(() => {
    const handleQuizTransition = () => {
      const storedQuizData = localStorage.getItem('quizData');
      
      if (storedQuizData) {
        try {
          const quizData = JSON.parse(storedQuizData);
          const summary = generateQuizSummary(quizData);
          // Reset messages but include quiz review
          setMessages([
            WELCOME_MESSAGE,
            { role: 'assistant', content: summary }
          ]);
          // Clear the stored quiz data to prevent showing it again on future reloads
          localStorage.removeItem('quizData');
        } catch (error) {
          console.error('Error parsing quiz data:', error);
          setMessages([WELCOME_MESSAGE]);
        }
      } else {
        // If no quiz data, just show welcome message
        setMessages([WELCOME_MESSAGE]);
      }
    };

    // Call on component mount
    handleQuizTransition();
  }, []); // Empty dependency array ensures this only runs once on mount

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const userMessage = { role: 'user' as const, content: input };
    setInput('');
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await axiosInstance.post('/api/ai-assist', {
        messages: newMessages,
        quizContext: null,
        chatContext: {
          quizData: currentQuizData
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const assistantMessage = {
        role: 'assistant' as const,
        content: response.data.message
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          navigate('/login');
        } else {
          const errorMessage = error.response?.data?.message || 'Failed to send message';
          toast.error(errorMessage);
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateQuizSummary = (data: QuizData) => {
    console.log('Generating summary for quiz data:', data);
    
    let summary = `# 🎓 Quiz Review\n\n`;
    summary += `## 📘 Course: ${data.courseName} \n`;
    summary += `**🧠 Difficulty:** ${data.difficulty} \n`;
    summary += `**🏆 Score:** ${data.score}/${data.totalQuestions} \n\n`;

    summary += `## 🔍 Questions \n\n`;
    data.questions.forEach((q, index) => {
      summary += `### 📝 Question ${index + 1} ${q.isCorrect ? '✅' : '❌'} \n\n`;
      summary += `**${q.question}** \n\n`;
      
      summary += `**Options:** \n\n`;
      if (Array.isArray(q.options)) {
        q.options.forEach(opt => {
          const isUserAnswer = opt.label === q.userAnswer;
          const isCorrectAnswer = opt.label === q.correctAnswer;
          summary += `${isUserAnswer ? '👉 ' : ''}${opt.text} ${isCorrectAnswer ? '✅' : ''}\n\n`;
        });
      }
      
      summary += `\n**Your Answer:** ${q.userAnswer} `;
      if (q.isCorrect) {
        summary += `✅ Correct!\n\n`;
      } else {
        summary += `❌ Wrong\n\n`;
        summary += `\n**_Correct answer was ${q.correctAnswer}_**\n\n`;
      }
    });

    return summary;
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

            {/* Chat Messages */}
            <div className="h-[calc(100vh-20rem)] overflow-y-auto p-6 space-y-8 bg-gray-50/50 dark:bg-gray-900/50">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} px-4`}
                  >
                    <div className={`flex-shrink-0 p-2.5 rounded-xl ${
                      message.role === 'user' 
                        ? 'bg-indigo-100 dark:bg-indigo-900/50' 
                        : 'bg-purple-100 dark:bg-purple-900/50'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div
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
                            <h3 className={`text-xl font-semibold mb-4 ${
                              String(children).includes('Questions to Review')
                                ? 'text-rose-600 dark:text-rose-400'
                                : String(children).includes('Excellent')
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-indigo-600 dark:text-indigo-400'
                            }`}>
                              {children}
                            </h3>
                          ),
                          h4: ({children}) => (
                            <h4 className="text-lg font-semibold text-amber-600 dark:text-amber-400 mb-4">
                              {children}
                            </h4>
                          ),
                          strong: ({children}) => (
                            <strong className={`font-semibold ${
                              String(children).includes('Your Answer')
                                ? 'text-rose-600 dark:text-rose-400'
                                : String(children).includes('Correct answer')
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : ''
                            }`}>
                              {children}
                            </strong>
                          ),
                          em: ({children}) => (
                            <em className="text-emerald-600 dark:text-emerald-400 not-italic font-semibold">
                              {children}
                            </em>
                          ),
                          hr: () => (
                            <hr className="my-8 border-gray-200 dark:border-gray-700" />
                          ),
                          p: ({children}) => (
                            <p className="text-base leading-relaxed mb-4">
                              {children}
                            </p>
                          ),
                          ul: ({children}) => (
                            <ul className="my-4 space-y-2">
                              {children}
                            </ul>
                          ),
                          ol: ({children}) => (
                            <ol className="my-4 space-y-2">
                              {children}
                            </ol>
                          ),
                          li: ({children, ordered}) => (
                            <li className={`flex items-start space-x-2 ${
                              ordered ? 'text-indigo-600 dark:text-indigo-400' : ''
                            }`}>
                              {children}
                            </li>
                          ),
                        }}
                        className="max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start px-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                      <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask about your quiz or any courses related topics..."
                  className="flex-1 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="w-5 h-5" />
                      <span>Send</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};



export default AIAssist;

