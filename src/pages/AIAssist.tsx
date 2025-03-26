import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../config/axios';
import axios from 'axios';
import { MessageSquare, Send, Bot, Loader2, History, Trash2, Plus, X, User } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { normalizeMarkdownText } from '../utils/markdown';

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

// Add TypeScript declaration at the top of the file
declare global {
  interface Window {
    userHasInteracted?: boolean;
    initialPageLoad?: boolean;
    navbarNavigation?: boolean;
  }
}

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
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track deleted chat IDs to prevent them from reappearing
  const deletedChatIdsRef = useRef<Set<string>>(new Set());

  // Refs
  const initRef = useRef(false);
  const sessionRef = useRef<string | null>(null);
  const lastActiveChatRef = useRef<string | null>(null);
  
  // Navigation
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token') !== null;

  // Memoized functions
  const quizSummariesCache = useRef<Record<string, string>>({});

  const generateQuizSummary = useCallback((quizData: QuizData) => {
    try {
      if (!quizData) return "No quiz data available";
      
      const { questions, score, totalQuestions, courseName } = quizData;
      const successRate = Math.round((score / totalQuestions) * 100);
      
      // Check if we have a cached version (for performance)
      const cacheKey = `${questions.map(q => q.question).join('')}-${score}-${totalQuestions}`;
      if (quizSummariesCache.current[cacheKey]) {
        console.log('Using cached quiz summary');
        return quizSummariesCache.current[cacheKey];
      }
      
      // Start building the summary
      let summary = `# Quiz Review: ${courseName}\n\n`;
      summary += `## Score: ${score}/${totalQuestions} (${successRate}%)\n\n`;
      
      if (successRate >= 80) {
        summary += "Excellent work! Let's review the questions to strengthen your understanding.\n\n";
      } else if (successRate >= 60) {
        summary += "Good effort! Let's review the questions to help clarify any areas of confusion.\n\n";
      } else {
        summary += "Let's review the questions to help improve your understanding of this topic.\n\n";
      }

      // Process each question with enhanced formatting and spacing
      questions.forEach((q, index) => {
        const questionNumber = index + 1;
        
        // Add question with proper markup and clear separation
        summary += `#### ${questionNumber}. ${q.question}\n\n`;
        
        // Process options with consistent treatment
        const options = q.options;
        const userAnswerLetter = q.userAnswer ? q.userAnswer.toUpperCase() : null;
        const correctAnswerLetter = q.correctAnswer ? q.correctAnswer.toUpperCase() : '';
        
        // Display options with proper formatting and on separate lines
        options.forEach((option, optIdx) => {
          const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D...
          
          // Get clean option text
          let optionText;
          if (typeof option === 'object' && option !== null) {
            optionText = option.text || String(option);
          } else {
            optionText = String(option);
          }
          
          // Clean option text with enhanced regex for all prefix types
          const cleanedText = optionText
            // First, handle double prefixes like "A. A:" or "D) D:"
            .replace(/^([A-Da-d])[.):]\s*\1[.):]\s*/g, '')
            // Then handle single prefixes like "A." or "A)" or "a." or "a)"
            .replace(/^[A-Da-d][.):]\s*/g, '')
            // Also handle cases with just a letter and space
            .replace(/^[A-Da-d]\s+/g, '')
            // Handle lowercase letter prefixes like "a." "b)" "c:"
            .replace(/^[a-d][.):]\s*/g, '')
            // Handle numeric prefixes like "1." "2)" "3:"
            .replace(/^[1-9][.):]\s*/g, '')
            .trim();
          
          // Format options with clear indicators - use uppercase for comparison
          const upperOptionLetter = optionLetter.toUpperCase();
          
          // ALWAYS include the option letter in uppercase for consistency
          // Use simplified indicators to avoid duplication
          if (upperOptionLetter === userAnswerLetter && upperOptionLetter === correctAnswerLetter) {
            // User selected correctly - just mark it as the correct answer they selected
            summary += `- ${optionLetter}. ${cleanedText} (Your answer - Correct)\n`;
          } else if (upperOptionLetter === userAnswerLetter) {
            // User selected incorrectly - ALWAYS show their incorrect answer
            summary += `- ${optionLetter}. ${cleanedText} (Your answer - Incorrect)\n`;
          } else if (upperOptionLetter === correctAnswerLetter) {
            // This is the correct answer but user didn't select it
            summary += `- ${optionLetter}. ${cleanedText} (Correct answer)\n`;
        } else {
            // Normal option - always include the letter
            summary += `- ${optionLetter}. ${cleanedText}\n`;
          }
        });
        
        // Add divider between questions
        if (index < questions.length - 1) {
        summary += `\n---\n\n`;
        }
      });
      
      // Cache the result for future use
      quizSummariesCache.current[cacheKey] = summary;
      
      return summary;
    } catch (error) {
      console.error("Error generating quiz summary:", error);
      return "Error: Unable to generate quiz summary. Please try again.";
    }
  }, []);

  // Add a new function to generate meaningful chat titles
  const generateChatTitle = (messages: Message[]): string => {
    // If it's a quiz review, extract the course name
    if (messages.length > 0 && messages[0].role === 'assistant' && messages[0].content.includes('Quiz Review:')) {
      const courseNameMatch = messages[0].content.match(/Quiz Review: ([^\n]+)/);
      if (courseNameMatch && courseNameMatch[1]) {
        return `Quiz Review: ${courseNameMatch[1]}`;
      }
    }
    
    // For regular chats, use the first user message as the title
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      // Use the first 40 characters of the user's message
      const title = firstUserMessage.content.substring(0, 40);
      return title + (firstUserMessage.content.length > 40 ? '...' : '');
    }
    
    // For empty chats or welcome-only chats
    return 'New Conversation';
  };

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
      if (options?.welcomeOnly || (initialMessages.length === 1 && initialMessages[0].role === 'assistant' && initialMessages[0].content === WELCOME_MESSAGE)) {
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

  // Completely disable the scrollToBottom function but keep it for references in the code
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const scrollToBottom = () => {
    // This function is intentionally disabled to prevent any automatic scrolling
    return; // No-op - do nothing
  };

  // Disable initial load scrolling
  useEffect(() => {
    // Only set initialization flag, never scroll
    if (!initRef.current) {
      initRef.current = true;
    }
    // No scroll timers or navigation flags needed
  }, []);

  // Disable MutationObserver scrolling
  useEffect(() => {
    // No observer needed - we're disabling all automatic scrolling
    return;
  }, [isInitialized]);

  // Disable message-based scrolling
  useEffect(() => {
    // No scrolling for new messages
    return;
  }, [messages.length, isInitialized, input]);

  // Remove user interaction event listeners for scrolling
  useEffect(() => {
    // No need to track user interaction for scrolling purposes
    return;
  }, []);

  // Add this helper function before the return statement to clean markdown formatting
  const cleanMarkdown = (text: string) => {
    if (!text) return '';
    return text
      .replace(/#{1,6}\s/g, '') // Remove heading markers
      .replace(/\*\*/g, '')     // Remove bold markers
      .replace(/\*/g, '')       // Remove italic markers
      .replace(/```[\s\S]*?```/g, 'Code snippet')  // Replace code blocks
      .replace(/`([^`]+)`/g, '$1')  // Remove inline code markers
      .replace(/-\s/g, '')      // Remove list markers
      .trim();
  };

  return (
    <div className="container mx-auto px-4">
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
            {/* Sidebar Header with Gradient and Animation */}
            <motion.div 
              className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-white/90" />
                  <h2 className="text-xl font-bold">Chat History</h2>
                </div>
                <motion.button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>

            {/* Search Input */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full p-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Chat History List with filtering based on search */}
            <div className="flex-1 overflow-y-auto p-3">
              {chatHistories.length > 0 ? (
                <div className="space-y-2">
                  {chatHistories
                    .filter(chat => {
                      if (!searchQuery.trim()) return true;
                      // Search in chat content and potential title
                      const chatContent = chat.messages.map(m => m.content).join(' ');
                      const potentialTitle = generateChatTitle(chat.messages);
                      return cleanMarkdown(chatContent).toLowerCase().includes(searchQuery.toLowerCase()) ||
                             potentialTitle.toLowerCase().includes(searchQuery.toLowerCase());
                    })
                    .map((chat) => (
                      <motion.div
                        key={chat._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                        className={`p-3 rounded-lg cursor-pointer transition-all border ${
                          currentChatId === chat._id
                            ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-700 shadow-md'
                            : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/70'
                        }`}
                        onClick={() => {
                          loadChat(chat._id);
                          setIsSidebarOpen(false);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {generateChatTitle(chat.messages)}
                            </p>
                            <div className="flex items-center mt-1">
                              {/* Add type indicator */}
                              {chat.type === 'quiz_review' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 mr-2">
                                  Quiz
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 mr-2">
                                  Chat
                                </span>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(chat.createdAt).toLocaleDateString()} {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this chat?')) {
                                deleteChat(chat._id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              ) : (
                <div className="text-center p-6 text-gray-500 dark:text-gray-400 flex flex-col items-center">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-30" />
                  <p className="font-medium">No chat history available</p>
                  <p className="text-sm mt-1">Start a new conversation to see it here</p>
                </div>
              )}
              
              {/* "No results" message when search has no matches */}
              {searchQuery && chatHistories.filter(chat => {
                const chatContent = chat.messages.map(m => m.content).join(' ');
                const potentialTitle = generateChatTitle(chat.messages);
                return cleanMarkdown(chatContent).toLowerCase().includes(searchQuery.toLowerCase()) ||
                       potentialTitle.toLowerCase().includes(searchQuery.toLowerCase());
              }).length === 0 && (
                <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                  <p>No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
            
            {/* Control Buttons */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
              <motion.button
                onClick={async () => {
                  // Create a new chat with welcome message
                  const initialMessages: Message[] = [{ role: 'assistant' as const, content: WELCOME_MESSAGE }];
                  const newChat = await createNewChat(initialMessages);
                  
                  if (newChat) {
                    setMessages(initialMessages);
                    setCurrentChatId(newChat._id);
                    localStorage.setItem('lastActiveChatId', newChat._id);
                  }
                  
                  setIsSidebarOpen(false);
                  toast.success('Started a new chat');
                }}
                className="w-full p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg transition-colors flex items-center justify-center shadow-md"
                whileHover={{ scale: 1.02, boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.4)" }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4 mr-2" />
                <span>New Chat</span>
              </motion.button>
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

      {/* Main Chat Area - Enhanced with better styling */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 w-full max-w-6xl mx-auto my-6"
      >
        {/* Chat Header - Enhanced with motion */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="p-3 bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 text-white bg-size-200 bg-pos-0 hover:bg-pos-100 transition-all duration-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">AI Learning Assistant</h2>
                <p className="text-indigo-100 text-xs mt-0.5">Powered by advanced AI to help you learn</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
                className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-medium">New Chat</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2"
              >
                <History className="w-5 h-5" />
                <span className="text-xs font-medium">History</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Chat Messages - Enhanced with animations and better styling */}
        <div className="h-[calc(100vh-250px)] overflow-y-auto bg-gray-50/50 dark:bg-gray-900/30 px-6 py-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
                >
                  {/* AI avatar icon - with enhanced appearance */}
                  {message.role === 'assistant' && (
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-md ring-2 ring-white dark:ring-gray-800"
                    >
                      <Bot className="h-5 w-5 text-white" />
                    </motion.div>
                  )}
                  
                  {/* Message bubble - with enhanced styling */}
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className={`max-w-[60%] rounded-2xl p-4 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white' 
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    <StyledMarkdown 
                      content={message.content} 
                      isQuiz={message.content.includes('Quiz Review')}
                    />
                  </motion.div>
                  
                  {/* User avatar icon - with enhanced appearance */}
                  {message.role === 'user' && (
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center ml-3 shadow-md ring-2 ring-white dark:ring-gray-800"
                    >
                      <User className="h-5 w-5 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area - Enhanced with better styling and animations */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90"
        >
          <div className="flex items-center space-x-3 max-w-5xl mx-auto">
            <motion.div 
              initial={{ width: "100%" }}
              whileFocus={{ scale: 1.01 }}
              className="relative flex-1 group"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about your quiz or any courses related topics..."
                className="w-full p-4 pr-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm shadow-sm group-hover:shadow-md"
              />
              {input.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setInput('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl text-sm"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </div>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// MOVED OUTSIDE: Enhanced StyledMarkdown component with improved styling for quizzes
interface StyledMarkdownProps {
  content: string;
  isQuiz?: boolean;
}

const StyledMarkdown: React.FC<StyledMarkdownProps> = ({ content, isQuiz = false }) => {
  // Process content with improved normalizing logic
  const normalizedContent = useMemo(() => {
    return normalizeMarkdownText(content);
  }, [content]);

  return (
    <div className="markdown-body relative break-words text-sm w-full">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h4: ({children, ...props}) => {
            if (isQuiz) {
              return (
                <h4 
                  {...props} 
                  className="text-base font-semibold border-b pb-1 border-gray-200 dark:border-gray-700 mt-4 mb-2 text-indigo-700 dark:text-indigo-400 w-full text-left"
                >
                  {children}
                </h4>
              );
            }
            return <h4 className="text-base font-semibold mt-3 mb-1.5 w-full text-left" {...props}>{children}</h4>;
          },
          h3: ({children, ...props}) => {
            if (isQuiz) {
              return (
                <h3 
                  {...props} 
                  className="text-lg font-bold border-b pb-1.5 border-indigo-200 dark:border-indigo-800 mt-4 mb-2 text-indigo-800 dark:text-indigo-300 w-full text-left"
                >
                  {children}
                </h3>
              );
            }
            return <h3 className="text-lg font-bold mt-4 mb-2 w-full text-left" {...props}>{children}</h3>;
          },
          h2: ({children, ...props}) => {
            if (isQuiz) {
              return (
                <h2 
                  {...props} 
                  className="text-xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text w-full text-left"
                >
                  {children}
                </h2>
              );
            }
            return <h2 className="text-xl font-bold mt-5 mb-3 w-full text-left" {...props}>{children}</h2>;
          },
          li: ({children, ...props}) => {
            if (isQuiz) {
              return (
                <li 
                  {...props} 
                  className="py-0.5 px-1.5 my-0.5 rounded-md bg-gray-50 dark:bg-gray-800/60 border-l-2 border-gray-300 dark:border-gray-600 quiz-option text-sm w-full"
                >
                  <QuizOptionContent content={children} />
                </li>
              );
            }
            return <li className="py-0.5 text-sm" {...props}>{children}</li>;
          },
          p: ({children, ...props}) => {
            if (isQuiz) {
              return <p className="my-1 text-sm w-full text-left" {...props}>{children}</p>;
            }
            return <p className="my-2 text-sm w-full text-left" {...props}>{children}</p>;
          },
          hr: ({...props}) => {
            if (isQuiz) {
              return <hr className="my-2 border-gray-200 dark:border-gray-700" {...props} />;
            }
            return <hr className="my-4 border-gray-300 dark:border-gray-600" {...props} />;
          },
          table: ({children, ...props}) => {
            return (
              <div className="overflow-x-auto w-full my-2">
                <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          pre: ({children, ...props}) => {
            return (
              <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded-md overflow-x-auto w-full text-sm my-2" {...props}>
                {children}
              </pre>
            );
          },
          code: ({children, ...props}) => {
            if (props.className?.includes('language-')) {
              return (
                <div className="w-full overflow-x-auto">
                  <code className={`${props.className} block p-2 text-sm`} {...props}>
                    {children}
                  </code>
                </div>
              );
            }
            return (
              <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};

// MOVED OUTSIDE: Enhanced QuizOptionContent component
const QuizOptionContent: React.FC<{content: React.ReactNode}> = ({ content }) => {
  // Convert React nodes to string for better pattern matching
  let text = '';
  
  const extractTextContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') {
      return node;
    } else if (React.isValidElement(node)) {
      const childrenText = React.Children.toArray(node.props.children)
        .map(extractTextContent)
        .join('');
      
      const elementType = typeof node.type === 'string' ? node.type : '';
      if (elementType === 'svg' || elementType === 'path') {
        return node.props.className?.includes('correct') ? '✓ ' : 
               node.props.className?.includes('incorrect') ? '❌ ' : '';
      }
      
      return childrenText;
    } else if (Array.isArray(node)) {
      return node.map(extractTextContent).join('');
    } else if (node === null || node === undefined) {
      return '';
    } else if (typeof node === 'object') {
      try {
        return String(node);
      } catch {
        return '';
      }
    }
    return String(node || '');
  };
  
  text = extractTextContent(content);
  
  // Extract option letter using a more comprehensive pattern that matches multiple formats
  const optionLetterMatch = 
    // Look for uppercase letter patterns: A., A:, A), etc.
    text.match(/^-?\s*([A-D])[.):]\s/) || 
    // Look for duplicate patterns like "A. A:" or "A) A)"
    text.match(/^-?\s*([A-D])[.):]\s*\1[.):]\s/) ||
    // Look for lowercase letter patterns: a., a:, a), etc.
    text.match(/^-?\s*([a-d])[.):]\s/) ||
    // Look for numeric options: 1., 2:, 3), etc.
    text.match(/^-?\s*([1-4])[.):]\s/);
  
  // Determine the option letter from the match
  let optionLetter = null;
  if (optionLetterMatch) {
    const matched = optionLetterMatch[1];
    // Convert to standardized uppercase A-D format
    if (/[A-D]/.test(matched)) {
      optionLetter = matched; // Already uppercase A-D
    } else if (/[a-d]/.test(matched)) {
      // Convert lowercase a-d to uppercase A-D
      optionLetter = matched.toUpperCase();
    } else if (/[1-4]/.test(matched)) {
      // Convert 1-4 to A-D
      optionLetter = String.fromCharCode(64 + parseInt(matched));
    }
  }
  
  // More comprehensive checks for correct/incorrect answers
  // Check for existing correct answer markers to avoid duplication
  const hasCorrectAnswerMarker = text.includes('(Correct answer)');
  const hasYourAnswerCorrectMarker = text.includes('(Your answer - Correct)');
  
  // Simplify detection by prioritizing explicit markers
  const isCorrectAnswer = hasCorrectAnswerMarker || 
                         hasYourAnswerCorrectMarker || 
                         (text.includes('Correct') && !text.includes('Your answer'));
  
  const isUserIncorrect = text.includes('(Your answer - Incorrect)') ||
                         text.includes('(Your answer)') && !text.includes('Correct');
  
  // Clean the content to remove redundant labels and indicators
  let cleanedContent = content;
  if (typeof content === 'string') {
    // Enhanced regex to clean option text with more patterns
    const optionWithoutLabels = content
      // Clean correctness indicators - remove all redundant indicators  
      .replace(/\s*✓\s*\(Correct answer\)\s*Correct\s*/g, '')
      .replace(/\s*\(Correct answer\)\s*Correct\s*/g, '')
      .replace(/\s*Correct\s*✓\s*\(Correct answer\)\s*/g, '')
      .replace(/\s*Correct\s*\(Correct answer\)\s*/g, '')
      // Clean option labels - handle double prefixes first (uppercase and lowercase)
      .replace(/^-?\s*([A-Da-d])[.):]\s*\1[.):]\s*/g, '')
      // Clean uppercase letter prefixes
      .replace(/^-?\s*[A-D][.):]\s*/g, '')
      // Clean lowercase letter prefixes
      .replace(/^-?\s*[a-d][.):]\s*/g, '')
      // Clean numeric prefixes
      .replace(/^-?\s*[1-9][.):]\s*/g, '')
      // Clean letter-only prefixes without punctuation
      .replace(/^-?\s*[A-Da-d]\s+/g, '')
      .replace(/\(\)\s*/g, ''); // Remove empty parentheses
    
    // For display, ensure we have a consistent letter prefix for each option
    const formattedContent = optionWithoutLabels.trim();
    
    // If we extracted an option letter, prepend it to the cleaned content for consistency
    if (optionLetter && !formattedContent.startsWith(optionLetter)) {
      cleanedContent = `${optionLetter}. ${formattedContent}`;
    } else {
      cleanedContent = formattedContent;
    }
  }
  
  // Prioritize correct answer check before incorrect check
  if (isCorrectAnswer) {
    return (
      <div className="flex items-start space-x-1.5 bg-green-50 dark:bg-green-900/30 p-0.5 rounded-md border-l-2 border-green-500 transition-colors w-full">
        <div className="flex-grow text-sm">{cleanedContent}</div>
        <div className="flex-shrink-0 flex items-center">
          <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400 correct-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-xs ml-0.5 font-medium text-green-700 dark:text-green-400">Correct</span>
        </div>
      </div>
    );
  } else if (isUserIncorrect) {
    return (
      <div className="flex items-start space-x-1.5 bg-red-100 dark:bg-red-900/40 p-0.5 rounded-md border-l-2 border-red-500 transition-colors w-full">
        <div className="flex-grow text-sm text-red-800 dark:text-red-300">{cleanedContent}</div>
        <div className="flex-shrink-0 flex items-center">
          <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400 incorrect-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-xs ml-0.5 font-medium text-red-700 dark:text-red-400">Your answer</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-start p-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors text-sm w-full">
      {cleanedContent}
    </div>
  );
};

export default AIAssist;