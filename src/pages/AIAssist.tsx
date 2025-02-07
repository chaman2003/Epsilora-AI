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
import ChatHistorySidebar from '../components/chat/ChatHistory';
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
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
          setChatHistories([]);
          setCurrentChatId(null);
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

    loadChatHistory();

    const initializeQuizData = async () => {
      let quizDataToUse = quizData;
      const storedQuizData = localStorage.getItem('quizData');

      if (!quizDataToUse && storedQuizData) {
        try {
          quizDataToUse = JSON.parse(storedQuizData);
          console.log('Retrieved quiz data from localStorage:', quizDataToUse);
          setQuizData(quizDataToUse);
        } catch (error) {
          console.error('Error parsing quiz data from localStorage:', error);
        }
      }

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

      if (!quizDataToUse) {
        setMessages([welcomeMessage]);
        return;
      }

      const summary = generateQuizSummary(quizDataToUse);
      const messages = [welcomeMessage, { role: 'assistant', content: summary }];
      setMessages(messages);
    };

    initializeQuizData();
  }, [isAuthenticated, navigate, quizData, setQuizData]);

  useEffect(() => {
    if (quizData && !currentChatId) {
      // Find existing quiz review chat
      const existingQuizChat = chatHistories.find(chat => 
        chat.type === 'quiz_review' && chat.metadata.courseName === quizData.courseName
      );

      if (existingQuizChat) {
        // Use existing chat
        setCurrentChatId(existingQuizChat._id);
        setMessages(existingQuizChat.messages);
      }

      const summary = generateQuizSummary(quizData);
      const quizMessage = { role: 'assistant' as const, content: summary };
      
      if (existingQuizChat) {
        // Append to existing chat
        const updatedMessages = [...messages, quizMessage];
        setMessages(updatedMessages);
        saveChat(updatedMessages);
      } else {
        // Create new chat
        createNewChat([quizMessage]);
      }
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

  const loadChatHistory = async () => {
    try {
      const response = await axios.get('/api/chat/ai/history');
      setChatHistories(response.data);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const createNewChat = async (initialMessages: Message[] = []) => {
    try {
      const response = await axios.post('/api/chat/ai/save', {
        messages: initialMessages,
        type: quizData ? 'quiz_review' : 'general',
        metadata: quizData ? {
          courseName: quizData.courseName,
          quizScore: quizData.score,
          totalQuestions: quizData.totalQuestions
        } : {}
      });
      const newChatId = response.data.chatId;
      setCurrentChatId(newChatId);
      await loadChatHistory();
      return newChatId;
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast.error('Failed to create new chat');
      return null;
    }
  };

  const loadChat = async (chatId: string) => {
    try {
      const response = await axios.get(`/api/chat/ai/${chatId}`);
      setMessages(response.data.messages || []);
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await axios.delete(`/api/chat/ai/${chatId}`);
      if (currentChatId === chatId) {
        setMessages([]);
        setCurrentChatId(null);
      }
      await loadChatHistory();
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const saveChat = async (messages: Message[]) => {
    if (!currentChatId) return false;

    try {
      await axios.put(`/api/chat/ai/${currentChatId}`, {
        messages
      });
      return true;
    } catch (error) {
      console.error('Error saving chat:', error);
      toast.error('Failed to save chat');
      return false;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chat/ai', {
        message: input,
        courseId: quizData?.courseId,
        quizScore: quizData?.score,
        totalQuestions: quizData?.totalQuestions
      });

      const assistantMessage = { role: 'assistant', content: response.data.message };
      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // Save chat history
      if (!currentChatId) {
        const chatType = quizData ? 'quiz_review' : 'general';
        const metadata = quizData ? {
          courseName: quizData.courseName,
          quizScore: quizData.score,
          totalQuestions: quizData.totalQuestions
        } : {};

        const saveResponse = await axios.post('/api/chat/ai/save', {
          messages: updatedMessages,
          type: chatType,
          metadata
        });
        setCurrentChatId(saveResponse.data.chatId);
      } else {
        await axios.put(`/api/chat/ai/${currentChatId}`, {
          messages: updatedMessages
        });
      }

      loadChatHistory(); // Refresh chat history
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const generateQuizSummary = (data: QuizData) => {
    // Calculate percentage with 1 decimal point
    const percentage = ((data.score / data.totalQuestions) * 100).toFixed(1);
    
    return `# 📊 Quiz Review Summary

📘 Course: ${data.courseName}
🎯 Difficulty: ${data.difficulty}
🏆 Score: ${data.score}/${data.totalQuestions} (${percentage}%)

## Question Details:
${data.questions.map((q, index) => `
Question ${index + 1}: ${q.isCorrect ? '✅' : '❌'}
${q.question}
Your Answer: ${q.userAnswer}
${!q.isCorrect ? `Correct answer: ${q.correctAnswer}` : ''}`).join('\n')}

Let me know if you have any questions about the quiz or would like to review specific topics! 📚`;
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

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setIsSidebarOpen(false);
  };

  const getChatPreview = (chat: ChatHistory) => {
    if (chat.type === 'quiz_review') {
      const { courseName, quizScore, totalQuestions } = chat.metadata;
      return `📝 Quiz Review: ${courseName} (${quizScore}/${totalQuestions})`;
    }

    // For general chats, use the first user message or a fallback
    const firstUserMessage = chat.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.slice(0, 40) + (firstUserMessage.content.length > 40 ? '...' : '');
    }
    return 'New Chat';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 relative">
          {/* Chat History Sidebar */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: "spring", damping: 20 }}
                className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden border-r border-gray-200 dark:border-gray-700 z-50"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-indigo-600" />
                    Chat History
                  </h2>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="Close sidebar"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setMessages([]);
                      setCurrentChatId(null);
                      setIsSidebarOpen(false);
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
                    aria-label="Start new chat"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Chat</span>
                  </button>
                </div>
                <div className="overflow-y-auto h-[calc(100%-9rem)] p-4 space-y-4">
                  {chatHistories.map((chat, index) => {
                    const chatPreview = getChatPreview(chat);
                    const formattedDate = format(new Date(chat.createdAt), 'MMM d, yyyy • HH:mm');

                    return (
                      <motion.div
                        key={chat._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                          currentChatId === chat._id
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500/50'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent'
                        }`}
                        onClick={() => {
                          loadChat(chat._id);
                          setIsSidebarOpen(false);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            chat.type === 'quiz_review'
                              ? 'bg-purple-100 dark:bg-purple-900/30'
                              : 'bg-indigo-100 dark:bg-indigo-900/30'
                          }`}>
                            {chat.type === 'quiz_review' ? (
                              <span className="text-lg">📝</span>
                            ) : (
                              <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {chatPreview}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formattedDate}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const confirmDelete = window.confirm('Are you sure you want to delete this chat?');
                              if (confirmDelete) {
                                deleteChat(chat._id);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                            aria-label="Delete chat"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Backdrop */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
              />
            )}
          </AnimatePresence>

          {/* Main Chat Area */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Chat Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">AI Learning Assistant</h2>
                    <p className="text-indigo-100 text-sm mt-1">Powered by advanced AI to help you learn</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setMessages([]);
                      setCurrentChatId(null);
                    }}
                    className="p-3 hover:bg-white/10 rounded-xl transition-colors flex items-center space-x-2"
                    aria-label="Start new chat"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-sm font-medium">New Chat</span>
                  </button>
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-3 hover:bg-white/10 rounded-xl transition-colors flex items-center space-x-2"
                    aria-label="View chat history"
                  >
                    <History className="w-6 h-6" />
                    <span className="text-sm font-medium">History</span>
                  </button>
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
                          className="prose prose-indigo dark:prose-invert max-w-none"
                        >
                          {message.content}
                        </ReactMarkdown>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start max-w-3xl space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
                        <div className="flex items-center space-x-3">
                          <Loader2 className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask about your quiz or any course-related topics..."
                  className="flex-1 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  aria-label="Send message"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
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
