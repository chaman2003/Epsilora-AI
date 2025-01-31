import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
  messages: Message[];
  isTyping?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  messages,
  isTyping = false,
}) => {
  const [inputMessage, setInputMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-lg border border-gray-700/50 h-[500px] flex flex-col"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-lg blur-xl" />
      
      {/* Header */}
      <div className="relative flex items-center justify-between p-4 border-b border-gray-700/50">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-transparent bg-clip-text">
            AI Assistant
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-400">Online</span>
        </div>
      </div>

      {/* Messages container */}
      <div className="relative flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  relative max-w-[80%] p-3 rounded-lg
                  ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 ml-12'
                      : 'bg-gradient-to-r from-gray-800 to-gray-800/50 mr-12'
                  }
                  backdrop-blur-sm border border-gray-700/50
                `}
              >
                {/* Message content */}
                <p className="text-gray-300 text-sm">{message.content}</p>
                
                {/* Timestamp */}
                <span className="absolute bottom-0 right-0 transform translate-y-full mt-1 text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>

                {/* Decorative elements */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  <div className="w-1 h-1 rounded-full bg-current opacity-50" />
                  <div className="w-1 h-1 rounded-full bg-current opacity-30" />
                  <div className="w-1 h-1 rounded-full bg-current opacity-10" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center space-x-2 text-gray-400"
            >
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200" />
              </div>
              <span className="text-sm">AI is typing...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="relative p-4 border-t border-gray-700/50">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="
              w-full px-4 py-2 rounded-lg
              bg-gray-800/50 border border-gray-700/50
              text-gray-300 placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-cyan-500/50
              transition-all duration-300
            "
          />
          <button
            type="submit"
            className="
              absolute right-2 p-2 rounded-lg
              bg-gradient-to-r from-cyan-500 to-blue-500
              text-white opacity-90 hover:opacity-100
              transition-opacity duration-300
              disabled:opacity-50
            "
            disabled={!inputMessage.trim()}
          >
            <svg
              className="w-5 h-5 transform rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>

        {/* Input focus effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </form>
    </motion.div>
  );
};

export default ChatInterface;
