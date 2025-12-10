import express from 'express';
import chatController from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/chat-history
 * @desc    Get all chat histories for authenticated user
 * @access  Private
 */
router.get('/', authenticateToken, chatController.getChatHistories);

/**
 * @route   GET /api/chat-history/:chatId
 * @desc    Get specific chat history by ID
 * @access  Private
 */
router.get('/:chatId', authenticateToken, chatController.getChatHistoryById);

/**
 * @route   POST /api/chat-history
 * @desc    Create new chat history
 * @access  Private
 */
router.post('/', authenticateToken, chatController.createChatHistory);

/**
 * @route   PUT /api/chat-history/:chatId
 * @desc    Update chat history
 * @access  Private
 */
router.put('/:chatId', authenticateToken, chatController.updateChatHistory);

/**
 * @route   DELETE /api/chat-history/all
 * @desc    Delete all chat histories for user
 * @access  Private
 */
router.delete('/all', authenticateToken, chatController.deleteAllChatHistories);

/**
 * @route   DELETE /api/chat-history/:chatId
 * @desc    Delete specific chat history
 * @access  Private
 */
router.delete('/:chatId', authenticateToken, chatController.deleteChatHistory);

export default router;
