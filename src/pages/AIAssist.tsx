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
  title: string;
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
  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
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
      role: 'assistant' as const,
      content: `# Welcome to Your AI Learning Assistant! ✨

## How I Can Help You
- 💡 Explain concepts clearly
- 📚 Provide learning resources
- 🔍 Answer your questions

## Pro Tips
- 🎯 Use "explain [topic]" for detailed explanations
- 📝 Use "example [concept]" for practice examples

> "${getRandomQuote().quote}"
> — ${getRandomQuote().author}

Ready to learn? Ask me anything! 🚀`
    }
  ];

  const formatResponse = (content: string) => {
    // Format programming language explanations
    if (content.includes('**Definition:**')) {
      const lines = content.split('\n');
      let formatted = '';
      let currentSection = '';

      lines.forEach(line => {
        if (line.startsWith('**') && line.endsWith('**') && !line.includes('Definition')) {
          // This is a language name, make it a heading
          formatted += `# ${line.replace(/\*\*/g, '')}\n\n`;
        } else if (line.startsWith('**') && line.includes(':')) {
          // This is a section header
          currentSection = line.replace(/\*\*/g, '').trim();
          formatted += `## ${currentSection}\n\n`;
        } else if (line.trim().startsWith('*')) {
          // This is a bullet point
          formatted += `${line}\n`;
        } else if (line.trim()) {
          // This is normal text
          formatted += `${line}\n\n`;
        }
      });
      return formatted;
    }
    return content;
  };

  useEffect(() => {
    setDisplayMessages([...welcomeMessages, ...messages]);
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const initializeChat = async () => {
      await loadChatHistories();
      
      // Only set messages if we have stored messages
      const storedMessages = localStorage.getItem('aiAssistMessages');
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          setMessages(parsedMessages);
        } catch (error) {
          console.error('Error parsing stored messages:', error);
          setMessages([]);
        }
      } else {
        setMessages([]);
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
        setMessages([]);
        setCurrentChatId(null);
      }

      // Remove any duplicate messages in existing chats
      const cleanedChats = response.data.map((chat: ChatHistory) => ({
        ...chat,
        messages: chat.messages.filter((msg, index, self) => 
          msg.role === 'assistant' || 
          !self.slice(0, index).some(m => 
            m.role === 'user' && 
            m.content.toLowerCase().trim() === msg.content.toLowerCase().trim()
          )
        )
      }));
      
      setChatHistories(cleanedChats);
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

      // Create a title based on the first message
      const firstMessage = initialMessages[0]?.content || '';
      let chatTitle = '';
      
      if (firstMessage.includes('Quiz Review')) {
        const courseMatch = firstMessage.match(/Course: (.*?)\n/);
        const course = courseMatch ? courseMatch[1].trim() : 'Unknown Course';
        chatTitle = `Quiz Review - ${course}`;
      } else {
        // Extract first line or first few words for the title
        chatTitle = firstMessage.split('\n')[0].slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
      }

      const response = await axiosInstance.post('/api/chat-history', {
        messages: initialMessages,
        title: chatTitle
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
    
    // Check for duplicate messages in the entire chat history
    const isDuplicate = messages.some(msg => 
      msg.role === 'user' && 
      msg.content.toLowerCase().trim() === userMessage.content.toLowerCase().trim()
    );

    if (isDuplicate) {
      toast.error('This question has already been asked. Please check the previous answers.');
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

      // Format the response before saving
      const formattedContent = formatResponse(response.data.message);
      const aiMessage = { role: 'assistant' as const, content: formattedContent };
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

  const renderMessages = () => {
    return (
      <>
        {/* Always show welcome message at the top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="welcome-section mb-6 border-b border-gray-200 dark:border-gray-700 pb-4"
        >
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            className="prose dark:prose-invert max-w-none"
          >
            {welcomeMessages[0].content}
          </ReactMarkdown>
        </motion.div>

        {/* Show actual chat messages */}
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'} mb-4`}
          >
            <div className={`flex items-start max-w-[80%] ${
              message.role === 'assistant' 
                ? 'bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm' 
                : 'bg-indigo-500 text-white rounded-lg p-3'
            }`}>
              <div className="flex-shrink-0 mr-2">
                {message.role === 'assistant' ? (
                  <Bot className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div className={message.role === 'assistant' ? 'prose dark:prose-invert max-w-none' : 'text-white'}>
                {message.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4" ref={messagesEndRef}>
        {renderMessages()}
      </div>
      
      {/* Input section */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssist;
