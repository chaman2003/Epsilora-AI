import React from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, X, Clock, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatHistory {
  _id: string;
  messages: Message[];
  createdAt: string;
}

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistories: ChatHistory[];
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onNewChat: () => void;
}

const ChatHistorySidebar: React.FC<ChatHistoryProps> = ({
  isOpen,
  onClose,
  chatHistories,
  currentChatId,
  onChatSelect,
  onDeleteChat,
  onNewChat,
}) => {
  // Get first message or a preview of the chat
  const getChatPreview = (messages: Message[]) => {
    if (!messages.length) return 'Empty chat';
    const firstMessage = messages[0].content;
    const preview = firstMessage.split('\n')[0]; // Get first line
    return preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
  };

  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return 'Today, ' + format(date, 'HH:mm');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday, ' + format(date, 'HH:mm');
    } else {
      return format(date, 'MMM d, yyyy HH:mm');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed left-0 top-0 h-full w-80 bg-gray-900 border-r border-gray-700/50 shadow-xl z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Chat History
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b border-gray-700/50">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Chat
            </button>
          </div>

          {/* Chat List */}
          <div className="overflow-y-auto h-[calc(100vh-8rem)]">
            {chatHistories.length === 0 ? (
              <div className="text-gray-400 text-center p-4">
                No chat history yet
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {chatHistories.map((chat) => (
                  <motion.div
                    key={chat._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative group rounded-lg p-4 cursor-pointer transition-all ${
                      currentChatId === chat._id
                        ? 'bg-indigo-600/20 border-indigo-500/50'
                        : 'bg-gray-800/40 hover:bg-gray-800/60 border-transparent'
                    } border`}
                    onClick={() => onChatSelect(chat._id)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 font-medium truncate">
                          {getChatPreview(chat.messages)}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(chat.createdAt)}
                        </div>
                      </div>
                      
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const confirmDelete = window.confirm('Are you sure you want to delete this chat?');
                          if (confirmDelete) {
                            onDeleteChat(chat._id);
                            toast.success('Chat deleted successfully');
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
                        aria-label="Delete chat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatHistorySidebar;
