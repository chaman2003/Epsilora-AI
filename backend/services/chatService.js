import Chat from '../models/Chat.js';

/**
 * Chat Service - Handles chat history business logic
 */
class ChatService {
  /**
   * Get all chat histories for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Chat histories
   */
  async getChatHistories(userId) {
    return await Chat.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Get specific chat history by ID
   * @param {string} chatId - Chat ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Chat history
   */
  async getChatHistoryById(chatId, userId) {
    const chatHistory = await Chat.findOne({
      _id: chatId,
      userId
    });
    
    if (!chatHistory) {
      throw new Error('Chat history not found');
    }
    
    return chatHistory;
  }

  /**
   * Create new chat history
   * @param {Object} chatData - Chat data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created chat
   */
  async createChatHistory(chatData, userId) {
    const newChat = new Chat({
      userId,
      messages: chatData.messages || [],
      title: chatData.title || 'New Chat'
    });
    return await newChat.save();
  }

  /**
   * Update chat history
   * @param {string} chatId - Chat ID
   * @param {Object} chatData - Updated chat data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated chat
   */
  async updateChatHistory(chatId, chatData, userId) {
    const chatHistory = await Chat.findOneAndUpdate(
      { _id: chatId, userId },
      { 
        messages: chatData.messages,
        title: chatData.title,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!chatHistory) {
      throw new Error('Chat history not found');
    }

    return chatHistory;
  }

  /**
   * Delete specific chat history
   * @param {string} chatId - Chat ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteChatHistory(chatId, userId) {
    const result = await Chat.findOneAndDelete({
      _id: chatId,
      userId
    });

    if (!result) {
      throw new Error('Chat history not found');
    }

    return { message: 'Chat history deleted successfully' };
  }

  /**
   * Delete all chat histories for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAllChatHistories(userId) {
    const result = await Chat.deleteMany({ userId });
    console.log(`Deleted ${result.deletedCount} chat histories for user ${userId}`);
    return {
      message: 'All chat histories deleted successfully',
      count: result.deletedCount
    };
  }
}

export default new ChatService();
