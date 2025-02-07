import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

const AIAssist: React.FC = () => {
  const { quizData } = useQuiz();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
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

    if (quizData) {
      const summary = generateQuizSummary(quizData);
      setMessages([welcomeMessage, { role: 'assistant', content: summary }]);
    } else {
      setMessages([welcomeMessage]);
    }
  }, [quizData]);

  const generateQuizSummary = (quiz: QuizData) => {
    const correctCount = quiz.questions.filter(q => q.isCorrect).length;
    const incorrectQuestions = quiz.questions.filter(q => !q.isCorrect);

    return `# 📊 Quiz Review Summary

📘 Course: ${quiz.courseName}
🎯 Difficulty: ${quiz.difficulty}
🏆 Score: ${quiz.score}/${quiz.totalQuestions}

${incorrectQuestions.length > 0 ? `
## Questions to Review:

${quiz.questions.map((q, index) => `
Question ${index + 1}: ${q.isCorrect ? '✅' : '❌'}
${q.question}
Your Answer: ${q.userAnswer}
${!q.isCorrect ? `Correct answer: ${q.correctAnswer}` : ''}`).join('\n')}

Let me know if you have any questions about the quiz or would like to review specific topics! 📚` : `

Congratulations! You got all questions correct! 🎉
Let me know if you'd like to explore any topics in more depth! 📚`}`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user' as const, content: input };
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await axios.post('/api/chat/ai', {
        message: input,
        courseId: quizData?.courseId,
        quizScore: quizData?.score,
        totalQuestions: quizData?.totalQuestions
      });

      const assistantMessage = { role: 'assistant' as const, content: response.data.message };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
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
            <AnimatePresence initial={false} mode="popLayout">
              {Array.isArray(messages) && messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
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
                          ul: ({children}) => (
                            <ul className="list-disc list-inside space-y-3 mb-6">
                              {children}
                            </ul>
                          ),
                          li: ({children}) => (
                            <li className="text-lg">
                              {children}
                            </li>
                          ),
                          p: ({children}) => (
                            <p className="text-lg mb-4 leading-relaxed">
                              {children}
                            </p>
                          ),
                          code: ({children}) => (
                            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {children}
                            </code>
                          )
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssist;
