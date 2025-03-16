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
      metadata?: {
        quizSummary?: string;
        courseName?: string;
      };
      welcomeOnly?: boolean;
    }
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return null;
      }

      // Don't save welcome-only messages to the database until user interacts
      if (options?.welcomeOnly) {
        console.log('Welcome message displayed but not saved to database yet');
        // Just return a temporary local object with the messages
        return {
          _id: 'temp-welcome-' + Date.now(),
          messages: initialMessages,
          createdAt: new Date().toISOString()
        };
      }

      // Check for duplicate chat content to avoid creating duplicates
      if (options?.type === 'quiz_review' && options?.metadata?.quizSummary) {
        // For quiz reviews, check if we already have one with the same content
        const existingQuizChat = chatHistories.find(
          chat => chat.type === 'quiz_review' && 
                 chat.metadata?.quizSummary === options.metadata?.quizSummary
        );
        
        if (existingQuizChat) {
          console.log('Found existing quiz review chat, using that instead of creating a new one');
          setCurrentChatId(existingQuizChat._id);
          setMessages(existingQuizChat.messages);
          localStorage.setItem('lastActiveChatId', existingQuizChat._id);
          return existingQuizChat;
        }
      } else if (initialMessages.length === 1 && initialMessages[0].role === 'assistant') {
        // For welcome messages, check if we already have a chat with just that message
        const existingWelcomeChat = chatHistories.find(
          chat => chat.messages.length === 1 && 
                 chat.messages[0].role === 'assistant' &&
                 chat.messages[0].content === initialMessages[0].content
        );
        
        if (existingWelcomeChat) {
          console.log('Found existing welcome chat, using that instead of creating a new one');
          setCurrentChatId(existingWelcomeChat._id);
          setMessages(existingWelcomeChat.messages);
          localStorage.setItem('lastActiveChatId', existingWelcomeChat._id);
          return existingWelcomeChat;
        }
      }

      // Prepare metadata with null checks
      const safeMetadata = options?.metadata ? {
        quizSummary: options.metadata.quizSummary || '',
        courseName: options.metadata.courseName || ''
      } : undefined;

      // Create the chat on the server
      const response = await axiosInstance.post('/api/chat-history', {
        messages: initialMessages,
        ...(options?.type && { type: options.type }),
        ...(safeMetadata && { metadata: safeMetadata })
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
  }, [navigate, chatHistories]);

  // Add a ref to track if we're currently processing quiz data
  const isProcessingQuizRef = useRef(false);

  // Add a robust function to find quiz data from multiple sources
  const findQuizData = () => {
    console.log('Searching for quiz data from multiple sources...');
    
    // Try context first
    if (quizData) {
      console.log('Found quiz data in context');
      return quizData;
    }
    
    // Then try localStorage
    try {
      const storedQuizData = localStorage.getItem('quizData');
      if (storedQuizData) {
        console.log('Found quiz data in localStorage');
        return JSON.parse(storedQuizData);
      }
    } catch (error) {
      console.error('Error parsing quiz data from localStorage:', error);
    }
    
    // Then try lastQuizData
    try {
      const lastQuizData = localStorage.getItem('lastQuizData');
      if (lastQuizData) {
        console.log('Found quiz data in lastQuizData');
        return JSON.parse(lastQuizData);
      }
    } catch (error) {
      console.error('Error parsing lastQuizData from localStorage:', error);
    }
    
    // Then try sessionStorage
    try {
      const sessionQuizData = sessionStorage.getItem('quizData');
      if (sessionQuizData) {
        console.log('Found quiz data in sessionStorage');
        return JSON.parse(sessionQuizData);
      }
    } catch (error) {
      console.error('Error parsing quiz data from sessionStorage:', error);
    }
    
    console.log('No quiz data found in any storage location');
    return null;
  };

  // Define processQuizData first, before it's used in initializeAIAssist
  const processQuizData = useCallback(async () => {
    // Use a ref to prevent duplicate processing
    if (isProcessingQuizRef.current) {
      console.log('Already processing quiz data, skipping');
      return;
    }
    
    isProcessingQuizRef.current = true;
    
    try {
      // Find quiz data from any available source
      const foundQuizData = quizData || findQuizData();
      
      if (!foundQuizData) {
        console.error('No quiz data available for processing');
        return;
      }
      
      console.log('Processing quiz data:', foundQuizData);
      console.log('Quiz data course name:', foundQuizData.courseName);
      console.log('Quiz data score:', foundQuizData.score);
      
      // Generate the quiz summary only once
      const quizSummary = generateQuizSummary(foundQuizData);
      console.log('Generated quiz summary first 100 chars:', quizSummary.substring(0, 100));
      
      // Check for an existing quiz review with the same content
      const existingQuizChat = chatHistories.find(
        (chat: ChatHistory) => 
          chat.type === 'quiz_review' && 
          chat.metadata?.quizSummary === quizSummary
      );

      if (existingQuizChat) {
        console.log('Found existing quiz chat, using that instead of creating a new one');
        setCurrentChatId(existingQuizChat._id);
        setMessages(existingQuizChat.messages);
        localStorage.setItem('lastActiveChatId', existingQuizChat._id);
      } else {
        console.log('Creating new quiz review chat');
        const quizMessage = { role: 'assistant' as const, content: quizSummary };
        await createNewChat([quizMessage], {
          type: 'quiz_review',
          metadata: {
            quizSummary,
            courseName: foundQuizData.courseName
          }
        });
      }
      
      // Clear from both localStorage and context after processing
      localStorage.removeItem('quizData');
      console.log('Clearing quiz data from context after processing');
      setQuizData(null);
    } catch (error) {
      console.error('Error processing quiz data:', error);
    } finally {
      isProcessingQuizRef.current = false;
    }
  }, [quizData, chatHistories, generateQuizSummary, createNewChat, setQuizData]);

  // Now define initializeAIAssist after processQuizData is defined
  const initializeAIAssist = useCallback(async () => {
    // Use a ref to prevent multiple initializations
    if (isInitialized) {
      console.log('AIAssist already initialized, skipping initialization');
      return;
    }

    try {
      console.log('Initializing AI Assist with quiz data...');
      
      // Find quiz data from any available source
      const foundQuizData = findQuizData();
      
      if (foundQuizData) {
        console.log('Quiz data found, setting to context:', foundQuizData);
        // Set a flag in localStorage to indicate we've processed this quiz data
        const quizDataId = `${foundQuizData.courseName}-${foundQuizData.score}-${foundQuizData.totalQuestions}`;
        const processedQuizzes = JSON.parse(localStorage.getItem('processedQuizzes') || '[]');
        
        if (processedQuizzes.includes(quizDataId)) {
          console.log('This quiz data has already been processed, skipping');
          // Remove the quiz data from storage to prevent reprocessing
          localStorage.removeItem('quizData');
          setQuizData(null);
        } else {
          // Mark this quiz as processed
          processedQuizzes.push(quizDataId);
          localStorage.setItem('processedQuizzes', JSON.stringify(processedQuizzes));
          
          // Process the quiz data
          setQuizData(foundQuizData);
          
          // Give time for the context to update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Process the quiz data
          await processQuizData();
        }
      } else {
        console.log('No quiz data found, displaying welcome message');
        // If we're not loading a specific chat and there's no quiz data, show welcome message
        if (!currentChatId || currentChatId.startsWith('temp-welcome-')) {
          setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error in initializeAIAssist:', error);
      // Fall back to welcome message on any error
      setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
      setIsInitialized(true);
    }
  }, [currentChatId, processQuizData, setQuizData, setMessages, isInitialized]);

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
  }, [isAuthenticated, navigate, loadChatHistories]);
  
  // Separate useEffect for initialization to prevent dependency loop
  useEffect(() => {
    // Only initialize after chat histories are loaded and we're not already initialized
    if (chatHistories.length !== undefined && !isInitialized && !isProcessingQuizRef.current) {
      initializeAIAssist();
    }
  }, [chatHistories.length, isInitialized, initializeAIAssist]);

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
      
      // Check if we're using a temporary welcome chat (ID starts with 'temp-welcome-')
      const isTemporaryWelcomeChat = typeof chatId === 'string' && chatId.startsWith('temp-welcome-');
      
      // Create a new chat if we don't have one or if we're using a temporary welcome chat
      if (!chatId || isTemporaryWelcomeChat) {
        try {
          console.log('Creating new chat with initial messages:', newMessages);
          // Check if we already have an identical chat first
          const existingChat = chatHistories.find(
            chat => chat.messages.length === newMessages.length && 
                   JSON.stringify(chat.messages) === JSON.stringify(newMessages)
          );
          
          if (existingChat) {
            console.log('Found existing chat with same messages, using that instead of creating a new one');
            chatId = existingChat._id;
            setCurrentChatId(chatId);
          } else {
            const newChat = await createNewChat(newMessages);
            if (newChat && newChat._id) {
              chatId = newChat._id;
              setCurrentChatId(chatId);
              console.log('Created new chat with ID:', chatId);
            } else {
              throw new Error('Failed to create chat properly');
            }
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
      
      try {
        const aiResponse = await axiosInstance.post('/api/super-simple-ai', {
          messages: newMessages,
          chatContext: { 
            chatId,
            firstMessage: messages[0]?.content || '',
            quizData: quizData
          }
        }, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000 // Set 30 second timeout
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

        // Add a delay before refreshing the chat list to avoid race conditions
        setTimeout(() => {
          loadChatHistories();
        }, 1000);
      } catch (aiError) {
        console.error('Error getting AI response:', aiError);
        
        // Try to extract more detailed error information
        let errorMessage = 'Failed to get AI response';
        if (axios.isAxiosError(aiError) && aiError.response?.data) {
          const responseData = aiError.response.data;
          
          if (responseData.error) {
            errorMessage = `AI Error: ${responseData.error}`;
            console.error(`Detailed AI error:`, responseData);
            
            if (responseData.details && responseData.details.includes("getGenerativeModel")) {
              errorMessage = "AI service is not initialized properly. Please ensure the backend server is running correctly.";
              toast.error(errorMessage);
              
              // Add fallback message when AI is not available
              const fallbackMessage = {
                role: 'assistant' as const,
                content: "I'm sorry, but the AI service is currently unavailable. Please try again later or contact support if the issue persists."
              };
              
              const fallbackMessages = [...newMessages, fallbackMessage];
              setMessages(fallbackMessages);
              
              if (chatId) {
                await saveMessagesToChat(chatId, fallbackMessages);
              }
            } else if (responseData.suggestion) {
              toast.error(`${errorMessage}. ${responseData.suggestion}`);
            } else {
              toast.error(errorMessage);
            }
          } else {
            toast.error(`Server error: ${aiError.response.status}`);
          }
        } else {
          toast.error('Failed to connect to the AI service');
        }
      }
      
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
  }, [input, loading, messages, currentChatId, quizData, navigate, createNewChat, loadChatHistories, chatHistories]);

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

  // Add function to delete all chats
  const deleteAllChats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Confirm with the user before proceeding
      if (!window.confirm("Are you sure you want to delete all chats? This cannot be undone.")) {
        return;
      }

      // Track all chat IDs as deleted
      chatHistories.forEach(chat => {
        deletedChatIdsRef.current.add(chat._id);
      });
      
      console.log(`Added all ${chatHistories.length} chats to deleted chats tracking`);
      
      // Save deleted chat IDs to localStorage
      try {
        const deletedChats = Array.from(deletedChatIdsRef.current);
        localStorage.setItem('deletedChatIds', JSON.stringify(deletedChats));
      } catch (e) {
        console.error('Failed to save deleted chat IDs to localStorage:', e);
      }

      // Clear local state
      setChatHistories([]);
      setCurrentChatId(null);
      setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
      localStorage.removeItem('lastActiveChatId');

      // Delete all chats from the server
      await axiosInstance.delete('/api/chat-history/all', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Create a new welcome chat
      const initialMessages: Message[] = [{ role: 'assistant' as const, content: WELCOME_MESSAGE }];
      await createNewChat(initialMessages);
      
      toast.success('All chats deleted successfully');
    } catch (error) {
      console.error('Error deleting all chats:', error);
      loadChatHistories(); // Reload from server to ensure consistency
      toast.error('Failed to delete all chats');
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Don't auto-scroll on initial load, but scroll on new messages
  useEffect(() => {
    if (messages.length > 0 && isInitialized) {
      // Only scroll if it's a new message after initial load
      if (messages.length > 1) {
        scrollToBottom();
      }
    }
  }, [messages.length, isInitialized]);

  // Modify the StyledMarkdown component
  const StyledMarkdown = ({ content, isUserMessage }: { content: string, isUserMessage: boolean }) => (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({children}) => (
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            {children}
          </h1>
        ),
        h2: ({children}) => (
          <h2 className="text-xl md:text-2xl font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
            {children}
          </h2>
        ),
        h3: ({children}) => (
          <h3 className={`text-lg md:text-xl font-semibold mb-3 ${
            String(children).includes('Questions to Review') || String(children).includes('❌')
              ? 'text-rose-600 dark:text-rose-400'
              : String(children).includes('Excellent') || String(children).includes('✅')
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-indigo-600 dark:text-indigo-400'
          }`}>
            {children}
          </h3>
        ),
        h4: ({children}) => (
          <h4 className="text-base md:text-lg font-medium text-amber-600 dark:text-amber-400 mb-3">
            {children}
          </h4>
        ),
        strong: ({children}) => (
          <strong className={`font-semibold ${
            String(children).includes('Your Answer') && !String(children).includes('Correct!')
              ? 'text-rose-600 dark:text-rose-400'
              : String(children).includes('Correct answer') || String(children).includes('Correct!')
              ? 'text-emerald-600 dark:text-emerald-400'
              : ''
          }`}>
            {children}
          </strong>
        ),
        em: ({children}) => (
          <em className="text-emerald-600 dark:text-emerald-400 not-italic font-medium">
            {children}
          </em>
        ),
        hr: () => (
          <hr className="my-6 border-gray-200 dark:border-gray-700" />
        ),
        br: () => (
          <span className="block h-3 md:h-4" aria-hidden="true"></span>
        ),
        p: ({children}) => (
          <p className="text-base leading-relaxed mb-4">
            {children}
          </p>
        ),
        ul: ({children}) => (
          <ul className="my-4 space-y-2 list-disc list-inside">
            {children}
          </ul>
        ),
        ol: ({children}) => (
          <ol className="my-4 space-y-2 list-decimal list-inside">
            {children}
          </ol>
        ),
        li: ({children}) => (
          <li className="ml-2">{children}</li>
        ),
      }}
      className={`max-w-none whitespace-pre-wrap break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${
        isUserMessage ? 'text-white' : 'text-gray-800 dark:text-white'
      }`}
    >
      {content}
    </ReactMarkdown>
  );

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
                className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden border-r border-gray-200 dark:border-gray-700 z-50 flex flex-col"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/10 p-2 rounded-lg">
                        <History className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-lg">Conversation History</h3>
                    </div>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                      aria-label="Close sidebar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex space-x-2">
                  <button
                    onClick={async () => {
                      // Create a new chat with welcome message
                      const initialMessages: Message[] = [{ role: 'assistant', content: WELCOME_MESSAGE }];
                      const newChat = await createNewChat(initialMessages);
                      
                      if (newChat) {
                        setMessages(initialMessages);
                        setCurrentChatId(newChat._id);
                        localStorage.setItem('lastActiveChatId', newChat._id);
                      }
                      
                      setIsSidebarOpen(false);
                      toast.success('Started a new chat');
                    }}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Chat
                  </button>
                  
                  <button
                    onClick={deleteAllChats}
                    className="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center"
                    title="Delete all conversations"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Search (Optional) */}
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      className="w-full bg-gray-100 dark:bg-gray-700 border-0 rounded-lg py-2 pl-9 pr-3 text-sm placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Chat list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {chatHistories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mb-3">
                        <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No conversations yet</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Start a new chat to begin your learning journey</p>
                    </div>
                  ) : (
                    chatHistories.map((chat) => {
                      // Determine chat type and extract relevant info
                      const isQuizReview = chat.messages[0]?.content.includes('Quiz Review');
                      
                      // Extract metadata
                      let chatTitle = '';
                      let chatPreview = '';
                      let chatIcon = <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
                      const badges: {text: string, color: string}[] = [];
                      const timestamp = formatTimestamp(chat.createdAt);
                      const messageCount = chat.messages.length;
                      
                      if (isQuizReview) {
                        // Parse quiz review data
                        const courseMatch = chat.messages[0]?.content.match(/Course: (.*?)\n/);
                        const scoreMatch = chat.messages[0]?.content.match(/Score: (\d+)\/(\d+)/);
                        const difficultyMatch = chat.messages[0]?.content.match(/Difficulty:\*\* (.*?) \n/);
                        
                        const courseName = courseMatch ? courseMatch[1].trim() : '';
                        const score = scoreMatch ? `${scoreMatch[1]}/${scoreMatch[2]}` : '';
                        const difficulty = difficultyMatch ? difficultyMatch[1] : '';
                        
                        chatTitle = `Quiz Review: ${courseName}`;
                        chatPreview = `Performance: ${score} questions (${difficulty})`;
                        chatIcon = <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
                        
                        if (score) {
                          badges.push({ text: score, color: 'green' });
                        }
                        if (difficulty) {
                          badges.push({ text: difficulty, color: 'blue' });
                        }
                      } else {
                        // Handle regular chat - find first user message if exists
                        const firstUserMessage = chat.messages.find(msg => msg.role === 'user');
                        const firstMessage = firstUserMessage?.content || chat.messages[0]?.content || '';
                        
                        // Extract meaningful title
                        chatTitle = firstMessage.split('\n')[0].slice(0, 30) + (firstMessage.length > 30 ? '...' : '');
                        
                        // For regular chats, we'll show the first few words of the conversation
                        const contentPreview = firstMessage.replace(/[#*_]/g, '').slice(0, 40);
                        chatPreview = contentPreview + (contentPreview.length > 40 ? '...' : '');
                        
                        // Add message count badge
                        badges.push({ 
                          text: `${messageCount} msg${messageCount !== 1 ? 's' : ''}`, 
                          color: 'gray' 
                        });
                      }
                      
                      return (
                        <div
                          key={chat._id}
                          onClick={() => {
                            loadChat(chat._id);
                            setIsSidebarOpen(false);
                          }}
                          className={`group cursor-pointer rounded-xl transition-all duration-200 ${
                            currentChatId === chat._id
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                          }`}
                        >
                          <div className="p-3">
                            <div className="flex items-start">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${
                                isQuizReview
                                  ? 'bg-purple-100 dark:bg-purple-900/50' 
                                  : 'bg-indigo-100 dark:bg-indigo-900/50'
                              }`}>
                                {chatIcon}
                              </div>
                              
                              <div className="ml-3 flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {chatTitle}
                                  </h4>
                                  <div className="flex items-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                      {timestamp.split(' at ')[0]}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteChat(chat._id);
                                      }}
                                      className="ml-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                      title="Delete conversation"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                    </button>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                                  {chatPreview}
                                </p>
                                
                                {/* Badges */}
                                {badges.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {badges.map((badge, idx) => (
                                      <span 
                                        key={idx}
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium
                                          ${badge.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                            badge.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                          }`
                                      }
                                    >
                                      {badge.text}
                                    </span>
                                  ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* Footer */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Bot className="w-3.5 h-3.5" />
                      <span>Powered by Gemini AI</span>
                    </div>
                    <span>{chatHistories.length} conversation{chatHistories.length !== 1 ? 's' : ''}</span>
                  </div>
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
                className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40"
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
                      className={`rounded-2xl p-4 md:p-6 shadow-md max-w-[85%] ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white ml-2'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white mr-2'
                      }`}
                    >
                      <StyledMarkdown 
                        content={message.content} 
                        isUserMessage={message.role === 'user'} 
                      />
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