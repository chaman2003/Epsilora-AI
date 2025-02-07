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
  title: string;
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token') !== null;

  useEffect(() => {
    if (isAuthenticated) {
      loadChatHistories();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Show welcome message when there are no messages or when starting a new chat
    if (messages.length === 0 && showWelcome) {
      setMessages([{
        role: 'assistant',
        content: `
          <div class="welcome-message">
            <h2 class="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Welcome to Your AI Learning Assistant! 👋</h2>
            <p class="mb-3">I'm here to help you with:</p>
            <ul class="space-y-2 mb-4">
              <li class="flex items-center space-x-2">
                <span class="text-indigo-500">📚</span>
                <span>Understanding complex programming concepts</span>
              </li>
              <li class="flex items-center space-x-2">
                <span class="text-indigo-500">🔍</span>
                <span>Reviewing your quiz answers</span>
              </li>
              <li class="flex items-center space-x-2">
                <span class="text-indigo-500">💡</span>
                <span>Providing coding examples and explanations</span>
              </li>
              <li class="flex items-center space-x-2">
                <span class="text-indigo-500">🎯</span>
                <span>Answering your course-related questions</span>
              </li>
            </ul>
            <p class="text-gray-600 dark:text-gray-400">Feel free to ask me anything about your courses or programming concepts!</p>
          </div>
        `
      }]);
    }
  }, [messages, showWelcome]);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setShowWelcome(true);
    setIsSidebarOpen(false);
  };

  const loadChatHistories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axiosInstance.get('/api/chat', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!Array.isArray(response.data)) {
        console.error('Invalid response format:', response.data);
        toast.error('Failed to load chat history');
        return;
      }

      // For new users, ensure we start with a clean slate
      if (response.data.length === 0) {
        setMessages([]);
        setCurrentChatId(null);
        setShowWelcome(true);
      }
      
      setChatHistories(response.data);
    } catch (error) {
      console.error('Error loading chat histories:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          toast.error(error.response?.data?.message || 'Failed to load chat history');
        }
      } else {
        toast.error('Failed to load chat history');
      }
      setChatHistories([]);
    }
  };

  const loadChat = async (chatId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axiosInstance.get(`/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data || !response.data.messages) {
        toast.error('Invalid chat data received');
        return;
      }

      setShowWelcome(false);
      const uniqueMessages = removeDuplicateMessages(response.data.messages);
      const formattedMessages = uniqueMessages.map(msg => ({
        ...msg,
        content: msg.role === 'assistant' ? formatAIResponse(msg.content) : msg.content
      }));
      setMessages(formattedMessages);
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('Error loading chat:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          toast.error('Chat not found');
          // Remove the chat from local state if it's not found on server
          setChatHistories(prev => prev.filter(ch => ch._id !== chatId));
        } else if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          toast.error(error.response?.data?.message || 'Failed to load chat');
        }
      } else {
        toast.error('Failed to load chat');
      }
    }
  };

  const saveChat = async (messages: Message[]) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (currentChatId) {
        // Update existing chat
        await axiosInstance.put(`/api/chat/${currentChatId}`, {
          messages
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (messages.length > 0) {
        // Create new chat with a meaningful title
        const firstUserMessage = messages.find(m => m.role === 'user');
        const title = firstUserMessage 
          ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
          : 'New Chat';

        const response = await axiosInstance.post('/api/chat', {
          messages,
          title
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCurrentChatId(response.data._id);
      }

      // Reload chat histories to get the latest changes
      await loadChatHistories();
    } catch (error) {
      console.error('Error saving chat:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Failed to save chat');
      }
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // First update the local state to make the UI feel more responsive
      setChatHistories(prev => prev.filter(ch => ch._id !== chatId));
      if (currentChatId === chatId) {
        setMessages([]);
        setCurrentChatId(null);
        setShowWelcome(true);
      }

      const response = await axiosInstance.delete(`/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        toast.success('Chat deleted successfully');
      } else {
        // If the delete request fails, revert the local state changes
        loadChatHistories();
        toast.error('Failed to delete chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      // Revert local state changes on error
      loadChatHistories();
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else if (error.response?.status === 404) {
          // If the chat doesn't exist on the server, keep it deleted locally
          toast.success('Chat deleted successfully');
        } else {
          toast.error(error.response?.data?.message || 'Failed to delete chat');
        }
      } else {
        toast.error('Failed to delete chat');
      }
    }
  };

  const generateQuizSummary = (quizData: QuizData) => {
    // Only generate quiz review if we have valid quiz data
    if (!quizData || !quizData.courseName || quizData.totalQuestions === 0) {
      return null;
    }

    let summary = `# 🎓 Quiz Review\n\n`;
    summary += `## 📘 Course: ${quizData.courseName}\n`;
    summary += `**🧠 Difficulty:** ${quizData.difficulty || 'Standard'}\n`;
    summary += `**🏆 Score:** ${quizData.score}/${quizData.totalQuestions}\n\n`;

    if (quizData.questions && quizData.questions.length > 0) {
      summary += `### Question Review\n\n`;
      quizData.questions.forEach((q, index) => {
        summary += `#### Question ${index + 1}\n`;
        summary += `${q.question}\n\n`;
        summary += `Your Answer: ${q.userAnswer}\n`;
        summary += `${q.isCorrect ? '✅ Correct!' : `❌ Incorrect. Correct answer: ${q.correctAnswer}`}\n\n`;
      });
    }

    return summary;
  };

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

  const saveMessagesToChat = async (chatId: string, messages: Message[]) => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Try multiple ways to save messages
      try {
        // Method 1: Save as messages array
        await axiosInstance.put(`/api/chat/${chatId}`, {
          messages: messages
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        console.log('Method 1 failed, trying method 2');
        // Method 2: Save messages one by one
        for (const message of messages) {
          await axiosInstance.put(`/api/chat/${chatId}`, {
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
          await axiosInstance.put(`/api/chat/${chatId}`, {
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

  const generateChatTitle = (messages: Message[]) => {
    if (!messages.length) return 'New Chat';
    
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New Chat';

    // If it's a quiz review
    if (messages[0].content.includes('Quiz Review')) {
      const courseMatch = messages[0].content.match(/Course: (.*?)\n/);
      return courseMatch ? `Quiz Review - ${courseMatch[1]}` : 'Quiz Review';
    }

    // For regular chats, use the first user message
    const title = firstUserMessage.content.slice(0, 30);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const userMessage = { role: 'user' as const, content: input.trim() };
    setInput('');
    
    // Deduplicate messages by checking the last message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.content === userMessage.content) {
      toast.error('Please avoid sending duplicate messages');
      return;
    }
    
    // Filter out welcome message when creating new chat
    const chatMessages = messages.filter(m => !m.content.includes('Welcome to Your AI Learning Assistant'));
    const newMessages = [...chatMessages, userMessage];
    setMessages([...messages, userMessage]); // Keep welcome message in UI
    setLoading(true);

    try {
      let chatId = currentChatId;

      // Create new chat if needed
      if (!chatId) {
        const chatTitle = generateChatTitle(newMessages);
        const newChatId = await createNewChat(newMessages, chatTitle);
        if (!newChatId) {
          throw new Error('Failed to create new chat');
        }
        chatId = newChatId;
      }

      // Save messages to chat
      const saved = await saveMessagesToChat(chatId, newMessages);
      if (!saved) {
        throw new Error('Failed to save messages');
      }

      // Get AI response
      const response = await axiosInstance.post('/api/ai-assist', {
        messages: newMessages,
        isQuizReview: messages.some(msg => msg.content.includes('Quiz Review'))
      });

      const aiMessage = { 
        role: 'assistant' as const, 
        content: formatAIResponse(response.data.message)
      };
      
      const updatedMessages = [...newMessages, aiMessage];
      
      // Save AI response
      await saveMessagesToChat(chatId, updatedMessages);
      setMessages([...messages.filter(m => m.content.includes('Welcome')), ...updatedMessages]); // Keep welcome message
      
      // Update chat title
      const title = generateChatTitle(updatedMessages);
      await updateChatTitle(chatId, title);
      
      // Refresh chat histories
      await loadChatHistories();
    } catch (error) {
      console.error('Error in chat interaction:', error);
      toast.error('Failed to get AI response. Please try again.');
    } finally {
      setLoading(false);
    }
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

  const updateChatTitle = async (chatId: string, title: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axiosInstance.put(`/api/chat/${chatId}/title`, {
        title
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  const [fontSize, setFontSize] = useState(16);

  const renderMessage = (message: Message) => {
    if (message.role === 'assistant') {
      if (message.content.includes('Welcome to Your AI Learning Assistant')) {
        return (
          <div 
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: message.content }}
          />
        );
      }

      return (
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({node, ...props}) => (
                <p className="my-4 leading-7" {...props} />
              ),
              strong: ({node, ...props}) => (
                <strong className="font-semibold text-indigo-600 dark:text-indigo-400" {...props} />
              ),
              code: ({node, inline, ...props}) => (
                inline ? 
                  <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono" {...props} /> :
                  <code className="block p-4 my-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono overflow-x-auto" {...props} />
              ),
              ul: ({node, ...props}) => (
                <ul className="space-y-4 my-4" {...props} />
              ),
              li: ({node, ...props}) => (
                <li className="flex items-start space-x-3 leading-7 mb-4">
                  <span className="text-indigo-500 mt-1.5 flex-shrink-0">•</span>
                  <span className="flex-1" {...props} />
                </li>
              ),
              blockquote: ({node, ...props}) => (
                <blockquote className="border-l-4 border-indigo-500 pl-4 my-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-r-lg" {...props} />
              )
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      );
    }

    return (
      <div className="text-gray-800 dark:text-gray-200 leading-7">
        {message.content}
      </div>
    );
  };

  const HistoryModal = () => {
    if (!showHistoryModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Chat History</h2>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4">
            {chatHistories.map((chat) => (
              <div
                key={chat._id}
                className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  loadChat(chat._id);
                  setShowHistoryModal(false);
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{chat.title || 'Untitled Chat'}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {chat.messages.length > 0 
                    ? `${chat.messages[0].content.slice(0, 100)}...` 
                    : 'No messages'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-xl font-bold">AI Learning Assistant</h1>
        </div>
      </div>
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
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Chat History</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleNewChat}
                className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span>New Chat</span>
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100vh-120px)]">
              {chatHistories.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No chat history yet. Start a new chat!
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {chatHistories.map((chat) => (
                    <div
                      key={chat._id}
                      className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        currentChatId === chat._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500' : ''
                      }`}
                      onClick={() => {
                        loadChat(chat._id);
                        setIsSidebarOpen(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate pr-8">
                            {chat.title}
                          </h3>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {new Date(chat.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {chat.messages.length > 0 && (
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 truncate">
                              {chat.messages[chat.messages.length - 1].content.substring(0, 50)}
                              {chat.messages[chat.messages.length - 1].content.length > 50 ? '...' : ''}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat._id);
                          }}
                          className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <h1 className="text-xl font-bold">AI Learning Assistant</h1>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent"
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
                  className={`prose prose-sm max-w-none ${
                    message.role === 'assistant'
                      ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                      : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
                  }`}
                >
                  {renderMessage(message)}
                </div>
              </motion.div>
            ))}
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
      <HistoryModal />
    </motion.div>
  );
};

export default AIAssist;
