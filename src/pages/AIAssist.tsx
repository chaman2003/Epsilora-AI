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

interface ChatHistory {
  _id: string;
  messages: Message[];
  createdAt: string;
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
  const [autoScroll, setAutoScroll] = useState(true);
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
          setMessages([{ role: 'assistant', content: 'Welcome to AI Assist! Feel free to ask any questions.' }]);
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

    loadChatHistories();

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

      if (!quizDataToUse) {
        console.warn('No quiz data available, proceeding without quiz data.');
        // Allow access to AI Assist even without quiz data
        setMessages([{ role: 'assistant', content: 'Welcome to AI Assist! Feel free to ask any questions.' }]);
        return;
      }

      console.log('Using quiz data:', quizDataToUse);
      const summary = generateQuizSummary(quizDataToUse);

      const storedMessages = localStorage.getItem('aiAssistMessages');
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          setMessages(parsedMessages);
        } catch (error) {
          console.error('Error parsing stored messages:', error);
          setMessages([{ role: 'assistant', content: summary }]);
        }
      } else {
        setMessages([{ role: 'assistant', content: summary }]);

        createNewChat([{ role: 'assistant', content: summary }]);
      }
    };

    initializeQuizData();
  }, [isAuthenticated, navigate, quizData, setQuizData]);

  useEffect(() => {
    if (quizData && !currentChatId) {
      // Find existing quiz review chat
      const existingQuizChat = chatHistories.find(chat => 
        chat.messages.some(msg => msg.content.includes('Quiz Review'))
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
        saveMessagesToChat(existingQuizChat._id, updatedMessages);
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

  const loadChatHistories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axiosInstance.get('/api/chat-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // For new users, ensure we start with a clean slate
      if (response.data.length === 0) {
        setMessages([{ role: 'assistant', content: 'Welcome to AI Assist! Feel free to ask any questions.' }]);
        setCurrentChatId(null);
      }
      
      setChatHistories(response.data);
    } catch (error) {
      console.error('Error loading chat histories:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to load chat history');
      }
    }
  };

  const createNewChat = async (initialMessages: Message[] = []) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return null;
      }

      // Create new chat for all quiz reviews
      const response = await axiosInstance.post('/api/chat-history', {
        messages: initialMessages
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newChatId = response.data._id;
      setCurrentChatId(newChatId);
      await loadChatHistories();
      return newChatId;
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast.error('Failed to create new chat');
      return null;
    }
  };

  const loadChat = async (chatId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Find chat from local state instead of making API call
      const chat = chatHistories.find(ch => ch._id === chatId);
      if (chat) {
        setMessages(chat.messages);
        setCurrentChatId(chatId);
      } else {
        toast.error('Chat not found');
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      toast.error('Failed to load chat');
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axiosInstance.delete(`/api/chat-history/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (currentChatId === chatId) {
        setMessages([]);
        setCurrentChatId(null);
      }
      await loadChatHistories();
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const saveMessagesToChat = async (chatId: string, messages: Message[]) => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Try multiple ways to save messages
      try {
        // Method 1: Save as messages array
        await axiosInstance.put(`/api/chat-history/${chatId}`, {
          messages: messages
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        console.log('Method 1 failed, trying method 2');
        // Method 2: Save messages one by one
        for (const message of messages) {
          await axiosInstance.put(`/api/chat-history/${chatId}`, {
            message: message
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }

      // Verify messages were saved
      const savedChat = chatHistories.find(ch => ch._id === chatId);
      if (!savedChat || savedChat.messages.length !== messages.length) {
        // If verification fails, try one more time with both methods
        try {
          await axiosInstance.put(`/api/chat-history/${chatId}`, {
            messages: messages,
            message: messages[messages.length - 1]
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) {
          console.error('Final save attempt failed:', e);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving messages:', error);
      return false;
    }
  };

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
      let chatId = currentChatId;
      let saveAttempts = 0;
      const maxAttempts = 3;

      // Create or get chat ID
      if (!chatId) {
        try {
          const response = await axiosInstance.post('/api/chat-history', {
            messages: newMessages,
            message: userMessage
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          chatId = response.data._id;
          setCurrentChatId(chatId);
        } catch (e) {
          console.error('Failed to create chat:', e);
          // Fallback: try creating with just the message
          const response = await axiosInstance.post('/api/chat-history', {
            message: userMessage
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          chatId = response.data._id;
          setCurrentChatId(chatId);
        }
      }

      // Save user message
      while (saveAttempts < maxAttempts && chatId) {
        const saved = await saveMessagesToChat(chatId, newMessages);
        if (saved) break;
        saveAttempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Get current chat context
      const currentChat = chatHistories.find(ch => ch._id === chatId);
      const contextMessage = currentChat?.messages[0]?.content || '';
      const isQuizReview = contextMessage.includes('Quiz Review');

      // Get AI response with context
      const response = await axiosInstance.post('/api/ai-assist', {
        messages: newMessages,
        quizContext: null,
        chatContext: {
          isQuizReview,
          chatId,
          firstMessage: contextMessage,
          quizData: currentQuizData
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const assistantMessage = {
        role: 'assistant' as const,
        content: response.data.message
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save final messages with AI response
      saveAttempts = 0;
      while (saveAttempts < maxAttempts && chatId) {
        const saved = await saveMessagesToChat(chatId, finalMessages);
        if (saved) break;
        saveAttempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await loadChatHistories();
      const savedChat = chatHistories.find(ch => ch._id === chatId);
      if (!savedChat || savedChat.messages.length !== finalMessages.length) {
        await saveMessagesToChat(chatId!, finalMessages);
        await loadChatHistories();
      }

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
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 50;
    setAutoScroll(isAtBottom);
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
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Chat</span>
                  </button>
                </div>
                <div className="overflow-y-auto h-[calc(100%-9rem)] p-4 space-y-4">
                  {chatHistories.map((chat, index) => {
                    const isQuizReview = chat.messages[0]?.content.includes('Quiz Review');
                    const chatPreview = isQuizReview 
                      ? `Quiz Review #${chatHistories.length - index}`
                      : chat.messages[0]?.content.slice(0, 30) + '...';

                    return (
                      <div
                        key={chat._id}
                        className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                          currentChatId === chat._id
                            ? 'bg-indigo-50 dark:bg-indigo-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        onClick={() => {
                          loadChat(chat._id);
                          setIsSidebarOpen(false);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          <div className="flex-1 truncate">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {chatPreview}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(chat.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat._id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
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
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-sm font-medium">New Chat</span>
                  </button>
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-3 hover:bg-white/10 rounded-xl transition-colors flex items-center space-x-2"
                  >
                    <History className="w-6 h-6" />
                    <span className="text-sm font-medium">History</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent"
              onScroll={handleScroll}
            >
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-start space-x-4 ${
                      message.role === 'assistant' ? 'bg-white dark:bg-gray-800' : ''
                    } rounded-lg p-4`}
                  >
                    <div className={`flex-shrink-0 p-2.5 rounded-xl ${
                      message.role === 'assistant' 
                        ? 'bg-purple-100 dark:bg-purple-900/50' 
                        : 'bg-indigo-100 dark:bg-indigo-900/50'
                    }`}>
                      {message.role === 'assistant' ? (
                        <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <div
                      className={`rounded-2xl p-6 shadow-md ${
                        message.role === 'assistant'
                          ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                          : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
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
