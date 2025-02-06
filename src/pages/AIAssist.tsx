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

  // Educational quotes array
  const educationalQuotes = [
    { quote: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
    { quote: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
    { quote: "The mind is not a vessel to be filled but a fire to be ignited.", author: "Plutarch" },
    { quote: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { quote: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" }
  ];

  // Get random quote
  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * educationalQuotes.length);
    return educationalQuotes[randomIndex];
  };

  const welcomeMessages = [
    {
      content: `<div class="welcome-message">
        <h1 class="welcome-title">Welcome to Your AI Learning Assistant!✨</h1>
        <div class="feature-card">
          <h4>🎯 How I Can Help You</h4>
          <ul>
            <li>💡 Explain concepts clearly</li>
            <li>📚 Provide learning resources</li>
            <li>🔍 Answer your questions</li>
          </ul>
        </div>
        <div class="tip-box">
          <h3>Pro Tips</h3>
          <ul>
            <li>🎯 "explain [topic]" for detailed explanations</li>
            <li>📝 "example [concept]" for practice</li>
          </ul>
        </div>

        <div class="quote-box">
          <blockquote>
            <p><em>"${getRandomQuote().quote}"</em></p>
            <footer>— ${getRandomQuote().author}</footer>
          </blockquote>
        </div>

        <div class="gradient-text-blue">
          <p>Ready to learn? Ask me anything! 🚀</p>
        </div>
      </div>`,
      role: 'assistant' as const
    }
  ];

  // Add CSS styles for the welcome message
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .welcome-message {
        animation: fadeIn 1s ease-in;
        padding: 0.5rem;
        max-width: 600px;
        margin: 0 auto;
      }
      
      .welcome-title {
        font-size: 1.5rem;
        font-weight: bold;
        text-align: center;
        margin-bottom: 0.75rem;
        background: linear-gradient(45deg, #4f46e5, #7c3aed);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shimmer 2s infinite;
      }
      
      .feature-card {
        border-left: 4px solid #4f46e5;
        padding: 0.5rem 0.75rem;
        margin: 0.5rem 0;
        background: rgba(79, 70, 229, 0.05);
        border-radius: 6px;
        animation: slideIn 0.5s ease-out;
      }

      .feature-card h4 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 0.35rem;
        color: #4f46e5;
      }

      .feature-card ul, .tip-box ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .feature-card li, .tip-box li {
        margin: 0.25rem 0;
        padding-left: 1.25rem;
        position: relative;
        font-size: 0.9rem;
      }
      
      .tip-box {
        background: linear-gradient(45deg, rgba(79, 70, 229, 0.1), rgba(124, 58, 237, 0.1));
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        margin: 0.5rem 0;
        animation: fadeIn 0.5s ease-out;
      }

      .tip-box h3 {
        color: #4f46e5;
        margin-bottom: 0.35rem;
        font-size: 1rem;
        font-weight: 600;
      }
      
      .quote-box {
        background: linear-gradient(45deg, rgba(79, 70, 229, 0.1), rgba(13, 148, 136, 0.1));
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        margin: 0.5rem 0;
        animation: slideIn 0.5s ease-out;
      }

      .quote-box blockquote {
        border-left: 4px solid #4f46e5;
        padding-left: 0.5rem;
        margin: 0;
      }

      .quote-box p {
        font-style: italic;
        color: #4f46e5;
        margin: 0 0 0.25rem 0;
        font-size: 0.9rem;
      }

      .quote-box footer {
        color: #4f46e5;
        font-weight: 500;
        font-size: 0.85rem;
      }

      .gradient-text-blue {
        text-align: center;
        margin-top: 0.75rem;
      }

      .gradient-text-blue p {
        font-size: 1rem;
        font-weight: 600;
        background: linear-gradient(45deg, #4f46e5, #0d9488);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shimmer 2s infinite;
        margin: 0;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideIn {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes shimmer {
        0% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const initializeChat = async () => {
      await loadChatHistories();
      
      // Only set welcome message if there are no chat histories and no current messages
      const storedMessages = localStorage.getItem('aiAssistMessages');
      if (chatHistories.length === 0 && !storedMessages && messages.length === 0) {
        setMessages(welcomeMessages);
        // Only create a new chat if we don't have any existing chats
        if (chatHistories.length === 0) {
          createNewChat(welcomeMessages);
        }
      } else if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          // Don't set welcome messages if we already have chat history
          if (parsedMessages.length > 0 && !parsedMessages.every(msg => 
            msg.role === 'assistant' && msg.content.includes('Welcome to Your AI Learning Assistant'))) {
            setMessages(parsedMessages);
          }
        } catch (error) {
          console.error('Error parsing stored messages:', error);
          if (chatHistories.length === 0) {
            setMessages(welcomeMessages);
          }
        }
      }
    };

    initializeChat();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (quizData && !currentChatId) {
      const summary = generateQuizSummary(quizData);
      
      // Only proceed if we have a valid quiz summary
      if (summary) {
        const quizMessage = { role: 'assistant' as const, content: summary };
        
        // Check if we already have this quiz review in chat histories
        const existingQuizChat = chatHistories.find(chat => 
          chat.messages.some(msg => 
            msg.content.includes('Quiz Review') && 
            msg.content.includes(quizData.courseName) &&
            msg.content.includes(`Score: ${quizData.score}/${quizData.questions.length}`)
          )
        );

        if (existingQuizChat) {
          setCurrentChatId(existingQuizChat._id);
          setMessages(existingQuizChat.messages);
        } else {
          // Only create a new chat if the quiz data is valid
          createNewChat([quizMessage]);
          setMessages([quizMessage]);
        }
      }
    }
  }, [quizData, currentChatId, chatHistories]);

  const generateQuizSummary = (data: QuizData) => {
    // Don't generate quiz summary if data is incomplete
    if (!data || !data.courseName || !data.questions || data.questions.length === 0) {
      return null;
    }

    const totalQuestions = data.questions.length;
    const correctAnswers = data.questions.filter(q => q.isCorrect).length;
    const score = data.score || correctAnswers;

    let summary = `# 🎓 Quiz Review\n\n`;
    summary += `## 📘 Course: ${data.courseName}\n`;
    summary += `**🧠 Difficulty:** ${data.difficulty || 'Standard'}\n`;
    summary += `**🏆 Score:** ${score}/${totalQuestions}\n\n`;

    data.questions.forEach((q, index) => {
      summary += `### Question ${index + 1}\n`;
      summary += `${q.question}\n\n`;
      summary += `${q.isCorrect ? '✅' : '❌'} Your Answer: ${q.userAnswer}\n`;
      if (!q.isCorrect) {
        summary += `✨ Correct Answer: ${q.correctAnswer}\n`;
      }
      summary += '\n';
    });

    return summary;
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
        setMessages(welcomeMessages);
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

    const userMessage = { role: 'user' as const, content: input.trim() };
    setInput('');
    
    // Deduplicate messages by checking the last message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.content === userMessage.content) {
      toast.error('Please avoid sending duplicate messages');
      return;
    }
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      let chatId = currentChatId;

      // Create new chat if needed
      if (!chatId) {
        const newChatId = await createNewChat(newMessages);
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

      const aiMessage = { role: 'assistant' as const, content: response.data.message };
      const updatedMessages = [...newMessages, aiMessage];
      
      // Save AI response
      await saveMessagesToChat(chatId, updatedMessages);
      setMessages(updatedMessages);
      
      // Refresh chat histories
      await loadChatHistories();
    } catch (error) {
      console.error('Error in chat interaction:', error);
      toast.error('Failed to get AI response. Please try again.');
    } finally {
      setLoading(false);
    }
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
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-2"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    className={`prose prose-sm max-w-none ${
                      message.role === 'assistant'
                        ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                        : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div 
                        className="markdown-content"
                        dangerouslySetInnerHTML={{ 
                          __html: message.content.includes('<div class="welcome-message">')
                            ? message.content
                            : `<div>${message.content}</div>`
                        }}
                      />
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={materialDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
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
    </motion.div>
  );
};

export default AIAssist;
