import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { normalizeMarkdownText } from '../utils/markdown';
import CodeBlock from './CodeBlock';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const StyledMarkdown: React.FC<{ content: string; isQuiz?: boolean }> = ({ content, isQuiz = false }) => {
  // Check if content contains tables for conditional styling
  const hasTable = useMemo(() => {
    return content.includes('|') && (content.includes('\n|') || content.includes('| --'));
  }, [content]);

  // Process content with improved normalizing logic
  const normalizedContent = useMemo(() => {
    return normalizeMarkdownText(content);
  }, [content]);

  return (
    <div className="markdown-body relative break-words">
      {/* Apply conditional styling based on content */}
      {(hasTable || isQuiz) && (
        <style>
          {/* Enhanced quiz styling for better readability */}
          {isQuiz && `
            .markdown-body {
              line-height: 1.4;
            }
            
            h4 {
              font-size: 1.05rem;
              font-weight: 600;
              margin-top: 1rem;
              margin-bottom: 0.75rem;
              padding: 0.5rem 0.75rem;
              border-left: 4px solid #6366f1;
              background-color: #f5f7ff;
              border-radius: 0.375rem;
              color: #4f46e5;
            }
            
            ul, ol {
              margin: 0.625rem 0;
              padding-left: 1.25rem;
            }
            
            li {
              margin-bottom: 0.375rem;
              padding: 0.5rem 0.75rem;
              border-radius: 0.375rem;
              position: relative;
              list-style-position: outside;
              background-color: rgba(249, 250, 251, 0.7);
            }
            
            li:has(svg.correct-icon) {
              background-color: rgba(236, 253, 245, 0.7);
              border-left: 3px solid #10b981;
              padding-left: 0.75rem;
            }
            
            li:has(svg.incorrect-icon) {
              background-color: rgba(255, 241, 242, 0.7);
              border-left: 3px solid #ef4444;
              padding-left: 0.75rem;
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              h4 {
                border-left-color: #818cf8;
                background-color: rgba(67, 56, 202, 0.1);
                color: #a5b4fc;
              }
              
              li {
                background-color: rgba(31, 41, 55, 0.5);
              }
              
              li:has(svg.correct-icon) {
                background-color: rgba(6, 95, 70, 0.3);
                border-left-color: #34d399;
              }
              
              li:has(svg.incorrect-icon) {
                background-color: rgba(127, 29, 29, 0.3);
                border-left-color: #f87171;
              }
            }
          `}
        </style>
      )}
      
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({className, children, ...props}) => {
            const match = /language-(\w+)/.exec(className || '');
            return !match ? (
              <code className={className} {...props}>
                {children}
              </code>
            ) : (
              <CodeBlock
                code={String(children).replace(/\n$/, '')}
                language={match[1]}
              />
            );
          },
          // Apply responsive table styling with reduced spacing
          table: (props) => <table className="w-full overflow-x-auto rounded-lg" {...props} />,
          th: (props) => <th className="bg-gray-100 dark:bg-gray-700 p-1.5 font-semibold border border-gray-300 dark:border-gray-600" {...props} />,
          td: (props) => <td className="p-1.5 border border-gray-300 dark:border-gray-600" {...props} />,
          
          // Enhanced spacing for headings with reduced margins
          h2: (props) => <h2 className="text-xl font-bold mt-4 mb-2" {...props} />,
          h3: (props) => <h3 className="text-lg font-semibold mt-3 mb-1.5" {...props} />,
          h4: (props) => <h4 className="text-md font-medium mt-3 mb-1.5 p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg" {...props} />,
          
          // Better spacing for paragraphs with reduced margins
          p: (props) => <p className="my-2 leading-tight" {...props} />,
          
          // Improved list formatting with reduced spacing
          ul: (props) => <ul className="my-2 pl-4 space-y-0.5" {...props} />,
          ol: (props) => <ol className="my-2 pl-4 space-y-0.5" {...props} />,
          
          // Special styling for quiz content with reduced spacing
          li: ({children, ...props}) => {
            if (isQuiz && typeof children === 'string') {
              const text = String(children);
              
              if (text.includes('✓') || text.includes('(Correct answer)') || text.includes('(Your answer - Correct)')) {
                return (
                  <li {...props} className="py-1 px-2 my-1 rounded-md bg-green-50 dark:bg-green-900/20 border-l-3 border-green-500">
                    {text.replace('✓', '').replace('(Correct answer)', '').replace('(Your answer - Correct)', '')} 
                    <svg className="correct-icon inline-block w-3.5 h-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-green-700 dark:text-green-400 ml-1">
                      {text.includes('(Your answer - Correct)') ? '(Your answer - Correct)' : '(Correct answer)'}
                    </span>
                  </li>
                );
              } else if (text.includes('❌') || text.includes('(Incorrect)') || text.includes('(Your answer - Incorrect)')) {
                return (
                  <li {...props} className="py-1 px-2 my-1 rounded-md bg-red-50 dark:bg-red-900/20 border-l-3 border-red-500">
                    {text.replace('❌', '').replace('(Incorrect)', '').replace('(Your answer - Incorrect)', '')}
                    <svg className="incorrect-icon inline-block w-3.5 h-3.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-red-700 dark:text-red-400 ml-1">
                      {text.includes('(Your answer - Incorrect)') ? '(Your answer - Incorrect)' : '(Incorrect)'}
                    </span>
                  </li>
                );
              }
            }
            
            return <li className="py-1" {...props}>{children}</li>;
          },
          
          // Better spacing for horizontal rules
          hr: (props) => <hr className="my-3 border-t border-gray-200 dark:border-gray-700" {...props} />
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_KEY = 'AIzaSyAMYWOTTvkxBC58He7gzrZV2qO3v7yqML8';

  // Disabled scroll function - does nothing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const scrollToBottom = () => {
    // Function intentionally disabled to prevent automatic scrolling
    return;
  };

  // Set up a MutationObserver to detect content changes
  useEffect(() => {
    // Create the observer to watch for content changes
    const messagesContainer = document.querySelector('.aichat-messages-container');
    if (!messagesContainer) return;

    const observer = new MutationObserver(() => {
      scrollToBottom();
    });

    // Start observing the messages container for DOM changes
    observer.observe(messagesContainer, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };
  }, [isOpen]);

  // Scroll when new messages are added
  useEffect(() => {
    // Only scroll if close to the bottom
    const isUserNearBottom = () => {
      const container = document.querySelector('.aichat-messages-container');
      if (!container) return true;
      
      const scrollPosition = container.scrollTop + container.clientHeight;
      const threshold = container.scrollHeight - 100; // Within 100px of bottom
      return scrollPosition >= threshold;
    };

    if (messages.length > 0 && isUserNearBottom()) {
      // Scroll immediately and then again after a delay to ensure content is rendered
      scrollToBottom();
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length]);

  // Initial scroll when component mounts
  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 200);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: userMessage
            }]
          }]
        })
      });

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
      setMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { text: 'Sorry, I encountered an error. Please try again.', isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-40"
          style={{ maxHeight: 'calc(100vh - 5rem)', top: 'auto' }}
        >
          <div className="flex justify-between items-center p-3 border-b dark:border-gray-700">
            <h3 className="text-base font-semibold dark:text-white">AI Assistant</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="aichat-messages-container p-3 h-72 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${message.isUser ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    message.isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <StyledMarkdown 
                    content={message.text} 
                    isQuiz={!message.isUser && 
                      (
                        // Explicit quiz reviews
                        message.text.includes('Quiz Review:') || 
                        message.text.includes('## Quiz Review') ||
                        
                        // Question pattern with options
                        (
                          !!message.text.match(/(Which|What|How|Why|When|Where|Who)[\w\s,.'?:;()-]+\?/) && 
                          (
                            // Various option formats
                            message.text.includes('Options:') || 
                            !!message.text.match(/\*\*-\s*[A-D]\.\s*\*\*/) ||
                            !!message.text.match(/\*\*[A-D]\.\s*\*\*/) ||
                            !!message.text.match(/[A-D][.)]\s*[A-Za-z]/) ||
                            
                            // Answer indicators
                            message.text.includes('✓') || 
                            message.text.includes('✅') ||
                            message.text.includes('❌') || 
                            message.text.includes('(Correct answer)') ||
                            message.text.includes('(Your answer')
                          )
                        )
                      )}
                  />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-left mb-4">
                <div className="inline-block p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 p-2 text-sm border dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading}
                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIChat;
