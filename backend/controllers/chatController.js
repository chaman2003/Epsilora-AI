import chatService from '../services/chatService.js';
import { asyncHandler, sendSuccess, sendError } from '../utils/responseHandler.js';

/**
 * Chat Controller - Handles chat history routes
 */
class ChatController {
  /**
   * Get all chat histories for user
   * @route GET /api/chat-history
   */
  getChatHistories = asyncHandler(async (req, res) => {
    try {
      const chatHistories = await chatService.getChatHistories(req.user.id);
      return sendSuccess(res, { chatHistories }, 'Chat histories retrieved successfully');
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return sendError(res, 'Failed to fetch chat history', 500, error);
    }
  });

  /**
   * Get specific chat history by ID
   * @route GET /api/chat-history/:chatId
   */
  getChatHistoryById = asyncHandler(async (req, res) => {
    try {
      const chatHistory = await chatService.getChatHistoryById(req.params.chatId, req.user.id);
      return sendSuccess(res, { chatHistory }, 'Chat history retrieved successfully');
    } catch (error) {
      console.error('Error retrieving chat history:', error);
      if (error.message === 'Chat history not found') {
        return sendError(res, error.message, 404);
      }
      return sendError(res, 'Failed to retrieve chat history', 500, error);
    }
  });

  /**
   * Create new chat history
   * @route POST /api/chat-history
   */
  createChatHistory = asyncHandler(async (req, res) => {
    try {
      const newChat = await chatService.createChatHistory(req.body, req.user.id);
      return sendSuccess(res, { chat: newChat }, 'Chat history created successfully', 201);
    } catch (error) {
      console.error('Error saving chat history:', error);
      return sendError(res, 'Failed to save chat history', 500, error);
    }
  });

  /**
   * Update chat history
   * @route PUT /api/chat-history/:chatId
   */
  updateChatHistory = asyncHandler(async (req, res) => {
    try {
      const chatHistory = await chatService.updateChatHistory(
        req.params.chatId,
        req.body,
        req.user.id
      );
      return sendSuccess(res, { chatHistory }, 'Chat history updated successfully');
    } catch (error) {
      console.error('Error updating chat history:', error);
      if (error.message === 'Chat history not found') {
        return sendError(res, error.message, 404);
      }
      return sendError(res, 'Failed to update chat history', 500, error);
    }
  });

  /**
   * Delete specific chat history
   * @route DELETE /api/chat-history/:chatId
   */
  deleteChatHistory = asyncHandler(async (req, res) => {
    try {
      const result = await chatService.deleteChatHistory(req.params.chatId, req.user.id);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      console.error('Error deleting chat history:', error);
      if (error.message === 'Chat history not found') {
        return sendError(res, error.message, 404);
      }
      return sendError(res, 'Failed to delete chat history', 500, error);
    }
  });

  /**
   * Delete all chat histories for user
   * @route DELETE /api/chat-history/all
   */
  deleteAllChatHistories = asyncHandler(async (req, res) => {
    try {
      const result = await chatService.deleteAllChatHistories(req.user.id);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      console.error('Error deleting all chat histories:', error);
      return sendError(res, 'Failed to delete chat history', 500, error);
    }
  });
}

export default new ChatController();
