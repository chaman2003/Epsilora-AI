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
        createNewChat([welcomeMessage]);
        return;
      }

      const summary = generateQuizSummary(quizDataToUse);
      const messages = [welcomeMessage, { role: 'assistant', content: summary }];
      setMessages(messages);
      createNewChat(messages);
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
        setMessages([]);
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
      const chat = chatHistories.find(ch => ch._id === chatId);
      if (chat) {
        setMessages(chat.messages);
        setCurrentChatId(chatId);
        setIsSidebarOpen(false); // Close sidebar after selection
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
      await axiosInstance.put(`/api/chat-history/${chatId}`, {
        messages: messages
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local chat histories
      setChatHistories(prev => prev.map(chat => 
        chat._id === chatId ? { ...chat, messages } : chat
      ));
      
      return true;
    } catch (error) {
      console.error('Error saving messages:', error);
      toast.error('Failed to save messages');
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
${!q.isCorrect ? `Correct Answer: ${q.correctAnswer}` : ''}`).join('\n')}

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

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        chatHistories={chatHistories}
        currentChatId={currentChatId}
        onChatSelect={loadChat}
        onDeleteChat={deleteChat}
        onNewChat={handleNewChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <History className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">AI Assistant</h1>
          <div className="w-6" /> {/* Spacer for alignment */}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
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
        <div className="p-6 border-t border-gray-700/50 bg-white dark:bg-gray-800">
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
  );
};

export default AIAssist;
