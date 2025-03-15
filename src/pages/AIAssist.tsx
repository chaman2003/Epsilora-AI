import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  type?: string;
  metadata?: {
    quizSummary: string;
    courseName: string;
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
    userAnswer: string | null;
    correctAnswer: string;
    options: {
      label: string;
      text: string;
    }[];
  }[];
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const timeFormat = { hour: '2-digit', minute: '2-digit' } as const;
  const dateFormat = { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  } as const;

  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], timeFormat)}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], timeFormat)}`;
  } else {
    return `${date.toLocaleDateString([], dateFormat)} at ${date.toLocaleTimeString([], timeFormat)}`;
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

const organizeMessages = (messages: Message[]): Message[] => {
  const seen = new Set();
  return messages
    .filter(msg => {
      const contentPreview = msg.content.substring(0, 100);
      const key = `${msg.role}-${contentPreview}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(msg => ({
      ...msg,
      content: msg.content.trim()
    }));
};

const WELCOME_MESSAGE = `# 👋 Welcome to Epsilora AI Assistant!

## 🌟 Quick Tips:
- 📚 Ask about your quiz results for detailed analysis
- 🔍 Get personalized learning recommendations
- 💡 Use natural language to ask questions
- 🎯 Track your progress with quiz reviews
- ⚡ Get instant answers to your course queries

## 🎮 Getting Started:
Type your question below or click "New Chat" to start fresh! 

*Powered by advanced AI to enhance your learning journey* ✨`;

const AIAssist: React.FC = () => {
  // State declarations
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
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Track deleted chat IDs to prevent them from reappearing
  const deletedChatIdsRef = useRef<Set<string>>(new Set());

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);
  const sessionRef = useRef<string | null>(null);
  const lastActiveChatRef = useRef<string | null>(null);
  
  // Navigation
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token') !== null;

  // Memoized functions
  const generateQuizSummary = useMemo(() => {
    const cache = new Map<string, string>();
    return (data: QuizData) => {
      const cacheKey = `${data.courseName}-${data.score}-${data.totalQuestions}`;
      if (cache.has(cacheKey)) return cache.get(cacheKey)!;
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
            
            // Clean option text by removing any leading letter labels like "A)" or "B)" 
            let cleanedText = opt.text;
            if (typeof cleanedText === 'string') {
              cleanedText = cleanedText.replace(/^[a-dA-D]\)[\s]*/g, '');
            }
            
            summary += `${isUserAnswer ? '👉 ' : ''}**${opt.label}.** ${cleanedText} ${isCorrectAnswer ? '✅' : ''}\n\n`;
          });
        }
        
        summary += `\n**Your Answer:** ${q.userAnswer || 'Not answered'} `;
        if (q.isCorrect) {
          summary += `✅ Correct!\n\n`;
        } else if (q.userAnswer) {
          summary += `❌ Wrong\n\n`;
          summary += `\n**_Correct answer was ${q.correctAnswer}_**\n\n`;
        } else {
          summary += `❓ Not attempted\n\n`;
          summary += `\n**_Correct answer was ${q.correctAnswer}_**\n\n`;
        }
      });

      cache.set(cacheKey, summary);
      return summary;
    };
  }, []);

  const createNewChat = useCallback(async (
    initialMessages: Message[], 
    options?: {
      type?: string;
      metadata?: ChatHistory['metadata'];
    }
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return null;
      }

      // Create the chat on the server
      const response = await axiosInstance.post('/api/chat-history', {
        messages: initialMessages,
        ...(options?.type && { type: options.type }),
        ...(options?.metadata && { metadata: options.metadata })
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Make sure we have a valid response
      if (!response.data || !response.data._id) {
        console.error('Invalid response when creating new chat', response);
        toast.error('Failed to create new chat: Invalid server response');
        return null;
      }

      const newChat = response.data;

      // Update state in a way that avoids race conditions
      setChatHistories(prev => {
        // Make sure we're not duplicating chats
        const withoutDuplicates = prev.filter(chat => chat._id !== newChat._id);
        return [newChat, ...withoutDuplicates];
      });
      
      setCurrentChatId(newChat._id);
      setMessages(initialMessages);
      localStorage.setItem('lastActiveChatId', newChat._id);

      return newChat;
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast.error('Failed to create new chat');
      return null;
    }
  }, [navigate]);

  const processQuizData = useCallback(async () => {
    if (!quizData || !isInitialized || currentChatId) return;

    const existingQuizChat = chatHistories.find(
      (chat: ChatHistory) => chat.type === 'quiz_review' && 
              chat.metadata?.quizSummary === generateQuizSummary(quizData)
    );

    if (existingQuizChat) {
      setCurrentChatId(existingQuizChat._id);
      setMessages(existingQuizChat.messages);
    } else {
      const quizMessage = { role: 'assistant' as const, content: generateQuizSummary(quizData) };
      await createNewChat([quizMessage], {
        type: 'quiz_review',
        metadata: {
          quizSummary: generateQuizSummary(quizData),
          courseName: quizData.courseName
        }
      });
    }
  }, [quizData, isInitialized, currentChatId, chatHistories, generateQuizSummary, createNewChat]);

  // Load chat histories
  const loadChatHistories = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await axiosInstance.get('/api/chat-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure we're working with valid data
      const validHistories = Array.isArray(response.data) ? response.data : [];
      
      // Filter out any chats that are in our deleted chats tracking set
      const filteredHistories = validHistories.filter(chat => 
        !deletedChatIdsRef.current.has(chat._id)
      );
      
      if (filteredHistories.length < validHistories.length) {
        console.log(`Filtered out ${validHistories.length - filteredHistories.length} deleted chats`);
      }
      
      const sortedHistories = filteredHistories.sort((a: ChatHistory, b: ChatHistory) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setChatHistories(sortedHistories);

      // Check if we have any chats at all
      if (sortedHistories.length === 0) {
        // If no chats exist, clear any current chat state and display welcome message
        setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
        setCurrentChatId(null);
        localStorage.removeItem('lastActiveChatId');
        return;
      }

      // Restore last active chat if available
      const lastActiveChatId = localStorage.getItem('lastActiveChatId');
      if (lastActiveChatId) {
        // Check if the lastActiveChatId is in our deleted chats set
        if (deletedChatIdsRef.current.has(lastActiveChatId)) {
          console.log('Last active chat is in deleted set, removing from localStorage');
          localStorage.removeItem('lastActiveChatId');
        } else {
          const lastChat = sortedHistories.find(chat => chat._id === lastActiveChatId);
          if (lastChat) {
            setCurrentChatId(lastActiveChatId);
            setMessages(lastChat.messages);
            return;
          } else {
            // If the last active chat is not found (was deleted), remove it from localStorage
            localStorage.removeItem('lastActiveChatId');
          }
        }
      }

      // If no active chat was restored, show welcome message
      if (!quizData) {
        setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
      }
    } catch (error) {
      console.error('Error loading chat histories:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to load chat history');
      }
    }
  }, [navigate, quizData]);

  // Effects
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Load chat history first
    if (!initRef.current) {
      initRef.current = true;
      loadChatHistories();
    }

    const initializeAIAssist = async () => {
      try {
        // If we are loading a specific chat or there's a last active chat, don't try to use quiz data
        if (currentChatId || localStorage.getItem('lastActiveChatId')) {
          return;
        }

        // Always show welcome message instead of quiz data
        setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);

        // Only create a new chat if there are no existing chats
        if (chatHistories.length === 0) {
          const initialMessages: Message[] = [{ role: 'assistant' as const, content: WELCOME_MESSAGE }];
          await createNewChat(initialMessages);
        }
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAIAssist();
  }, [isAuthenticated, navigate, loadChatHistories, currentChatId, chatHistories, createNewChat]);

  // Remove quiz data processing since we want to always show welcome message
  useEffect(() => {
    // Clear any stored quiz data to prevent it from showing in future sessions
    localStorage.removeItem('quizData');
  }, []);

  useEffect(() => {
    return () => {
      initRef.current = false;
      sessionRef.current = null;
      localStorage.removeItem('currentAIChatSession');
    };
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const userMessage = { role: 'user' as const, content: input.trim() };
    setInput('');

    // Check for duplicate message
    const isDuplicate = messages.some(msg => 
      msg.role === userMessage.role && 
      msg.content === userMessage.content
    );
    
    if (isDuplicate) {
      toast.error('This message was already sent');
      return;
    }

    // Add user message to UI immediately
    const newMessages = organizeMessages([...messages, userMessage]);
    setMessages(newMessages);
    setLoading(true);

    try {
      let chatId = currentChatId;
      
      // Create a new chat if we don't have one
      if (!chatId) {
        try {
          console.log('Creating new chat with initial messages:', newMessages);
          const newChat = await createNewChat(newMessages);
          if (newChat && newChat._id) {
            chatId = newChat._id;
            setCurrentChatId(chatId);
            console.log('Created new chat with ID:', chatId);
          } else {
            throw new Error('Failed to create chat properly');
          }
        } catch (e) {
          console.error('Failed to create chat:', e);
          // Fallback: create a simpler chat
          try {
            console.log('Trying fallback chat creation');
            const response = await axiosInstance.post('/api/chat-history', {
              messages: [{ role: 'user' as const, content: userMessage.content }]
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data && response.data._id) {
              chatId = response.data._id;
              setCurrentChatId(chatId);
              console.log('Created fallback chat with ID:', chatId);
            } else {
              throw new Error('Invalid response from chat creation');
            }
          } catch (fallbackError) {
            console.error('Fallback chat creation also failed:', fallbackError);
            toast.error('Failed to create new chat. Please try again.');
            setLoading(false);
            return;
          }
        }
      } else {
        // If we already have a chat ID, save the user message
        console.log('Using existing chat ID:', chatId);
        const saveResult = await saveMessagesToChat(chatId, newMessages);
        if (!saveResult) {
          console.warn('Failed to save user message to existing chat');
        }
      }

      // Get AI response
      console.log('Getting AI response for chat:', chatId);
      const aiResponse = await axiosInstance.post('/api/super-simple-ai', {
        messages: newMessages,
        chatContext: { 
          chatId,
          firstMessage: messages[0]?.content || '',
          quizData: currentQuizData
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!aiResponse.data || !aiResponse.data.message) {
        throw new Error('Invalid AI response');
      }

      // Process AI response
      const assistantMessage = {
        role: 'assistant' as const,
        content: aiResponse.data.message
      };

      // Add AI response to state to update UI
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save the complete conversation with AI response
      console.log('Saving complete conversation');
      let saveSuccessful = false;
      
      // Try to save up to 3 times
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt + 1} to save messages`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (chatId) {  // Add null check for chatId
          saveSuccessful = await saveMessagesToChat(chatId, finalMessages);
          if (saveSuccessful) {
            console.log('Messages saved successfully');
            break;
          }
        }
      }

      if (!saveSuccessful) {
        console.warn('Failed to save complete conversation after multiple attempts');
        toast.error('Your message was sent, but there was an issue saving the conversation history.');
      }

      // Refresh the chat list to show the updated conversation
      await loadChatHistories();
      
    } catch (error) {
      console.error('Error in chat flow:', error);
      
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
  }, [input, loading, messages, currentChatId, currentQuizData, navigate, createNewChat, loadChatHistories]);

  const saveMessagesToChat = async (chatId: string, messagesToSave: Message[]): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return false;
      }

      // Deep clone the messages to avoid reference issues
      const messagesToSend = JSON.parse(JSON.stringify(messagesToSave));
      
      // Make sure messages are organized and unique
      const uniqueMessages = organizeMessages(messagesToSend);
      
      if (uniqueMessages.length === 0) {
        console.error('No messages to save');
        return false;
      }

      // Use a more explicit approach with logging
      console.log(`Saving ${uniqueMessages.length} messages to chat ${chatId}`);
      
      const response = await axiosInstance.put(`/api/chat-history/${chatId}`, {
        messages: uniqueMessages
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Check response status
      if (response.status >= 200 && response.status < 300) {
        console.log('Messages saved successfully');
        return true;
      } else {
        console.error('Unexpected response status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error saving messages to chat:', error);
      return false;
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
        lastActiveChatRef.current = chatId;
        localStorage.setItem('lastActiveChatId', chatId);
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

      // Add to deleted chats tracking
      deletedChatIdsRef.current.add(chatId);
      console.log(`Added ${chatId} to deleted chats tracking`);
      
      // Save deleted chat IDs to localStorage for persistence across sessions
      try {
        const deletedChats = Array.from(deletedChatIdsRef.current);
        localStorage.setItem('deletedChatIds', JSON.stringify(deletedChats));
      } catch (e) {
        console.error('Failed to save deleted chat IDs to localStorage:', e);
      }

      // First, update local state to immediately reflect the deletion
      // Store a copy of the remaining chats for later use
      const updatedChatHistories = chatHistories.filter(chat => chat._id !== chatId);
      setChatHistories(updatedChatHistories);

      // If we're deleting the current chat, reset the UI state
      const isDeletingCurrentChat = currentChatId === chatId;
      if (isDeletingCurrentChat) {
        setCurrentChatId(null);
        setMessages([{ role: 'assistant' as const, content: WELCOME_MESSAGE }]);
        localStorage.removeItem('lastActiveChatId');
      }

      // Now delete from the server
      await axiosInstance.delete(`/api/chat-history/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // If this was the last chat, create a new one with welcome message
      if (updatedChatHistories.length === 0) {
        const initialMessages: Message[] = [{ role: 'assistant' as const, content: WELCOME_MESSAGE }];
        const newChat = await createNewChat(initialMessages);
        
        if (newChat) {
          // Don't call loadChatHistories to avoid race conditions
          // Just update the state directly
          setChatHistories([newChat]);
          setCurrentChatId(newChat._id);
          setMessages(initialMessages);
          localStorage.setItem('lastActiveChatId', newChat._id);
        }
      } else if (isDeletingCurrentChat && updatedChatHistories.length > 0) {
        // If we deleted the current chat but have other chats, select the most recent one
        const mostRecentChat = updatedChatHistories[0]; // Already sorted by date
        setCurrentChatId(mostRecentChat._id);
        setMessages(mostRecentChat.messages);
        localStorage.setItem('lastActiveChatId', mostRecentChat._id);
      }

      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      
      // Revert local changes if server deletion failed
      loadChatHistories(); // Reload from server to ensure consistency
      toast.error('Failed to delete chat');
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
                    onClick={async () => {
                      // First save the current chat if it exists
                      if (messages.length > 1 && currentChatId) {  
                        // Save current chat to ensure it's persisted
                        await saveMessagesToChat(currentChatId, messages);
                      }
                      
                      // Create a new chat with welcome message
                      const initialMessages: Message[] = [{ role: 'assistant' as const, content: WELCOME_MESSAGE }];
                      const newChat = await createNewChat(initialMessages);
                      
                      if (newChat) {
                        setMessages(initialMessages);
                        setCurrentChatId(newChat._id);
                        localStorage.setItem('lastActiveChatId', newChat._id);
                      } else {
                        // Fallback if API call fails
                        setMessages(initialMessages);
                        setCurrentChatId(null);
                        localStorage.removeItem('lastActiveChatId');
                      }
                      
                      setIsSidebarOpen(false);
                      toast.success('Started a new chat');
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
                    let chatPreview = '';
                    let courseName = '';
                    let timestamp = formatTimestamp(chat.createdAt);
                    
                    if (isQuizReview) {
                      const courseMatch = chat.messages[0]?.content.match(/Course: (.*?)\n/);
                      const scoreMatch = chat.messages[0]?.content.match(/Score: (\d+)\/(\d+)/);
                      courseName = courseMatch ? courseMatch[1].trim() : '';
                      const score = scoreMatch ? `(${scoreMatch[1]}/${scoreMatch[2]})` : '';
                      chatPreview = `Quiz Review: ${courseName} ${score}`;
                    } else {
                      const firstMessage = chat.messages[0]?.content || '';
                      chatPreview = firstMessage.length > 40 
                        ? `${firstMessage.slice(0, 40)}...`
                        : firstMessage;
                    }

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
                          <div className={`p-2 rounded-lg ${
                            isQuizReview
                              ? 'bg-purple-100 dark:bg-purple-900/50' 
                              : 'bg-indigo-100 dark:bg-indigo-900/50'
                          }`}>
                            {isQuizReview ? (
                              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            ) : (
                              <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {chatPreview}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {timestamp}
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
                <div className="flex items-center space-x-4">
                  <button
                    onClick={async () => {
                      // First save the current chat if it exists
                      if (messages.length > 1 && currentChatId) {  
                        // Save current chat to ensure it's persisted
                        await saveMessagesToChat(currentChatId, messages);
                      }
                      
                      // Create a new chat with welcome message
                      const initialMessages: Message[] = [{ role: 'assistant' as const, content: WELCOME_MESSAGE }];
                      const newChat = await createNewChat(initialMessages);
                      
                      if (newChat) {
                        setMessages(initialMessages);
                        setCurrentChatId(newChat._id);
                        localStorage.setItem('lastActiveChatId', newChat._id);
                      } else {
                        // Fallback if API call fails
                        setMessages(initialMessages);
                        setCurrentChatId(null);
                        localStorage.removeItem('lastActiveChatId');
                      }
                      
                      setIsSidebarOpen(false);
                      toast.success('Started a new chat');
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