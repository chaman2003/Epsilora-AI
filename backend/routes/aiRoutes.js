import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler, sendSuccess, sendError } from '../utils/responseHandler.js';
import { generateContent } from '../utils/gemini.js';

const router = express.Router();

/**
 * @route POST /api/super-simple-ai
 * @desc Generate AI response for chat
 * @access Private
 */
router.post('/super-simple-ai', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return sendError(res, 'Invalid messages format', 400);
    }

    // Build conversation history for Gemini
    let conversationHistory = '';
    for (const message of messages) {
      const role = message.role === 'user' ? 'User' : 'Assistant';
      conversationHistory += `${role}: ${message.content}\n`;
    }

    // Get the last user message as the main prompt
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return sendError(res, 'Last message must be from user', 400);
    }

    // Create a prompt for Gemini
    const systemPrompt = `You are a helpful AI assistant for an educational platform called Epsilora AI. 
You help users learn, answer questions, and provide support with their courses and quizzes.
Be concise, helpful, and educational in your responses.`;

    const fullPrompt = `${systemPrompt}\n\nConversation:\n${conversationHistory}`;

    console.log('Generating AI response with prompt:', fullPrompt.substring(0, 100) + '...');

    // Generate response using Gemini
    const aiResponse = await generateContent(fullPrompt);

    if (!aiResponse) {
      return sendError(res, 'Failed to generate AI response', 500);
    }

    return sendSuccess(res, { message: aiResponse }, 'AI response generated successfully');
  } catch (error) {
    console.error('Error in AI response generation:', error);
    let errorMessage = error.message || 'Failed to generate AI response';
    
    // Handle rate limiting
    if (error.message.includes('429') || error.message.includes('rate')) {
      errorMessage = 'AI service is busy. Please try again in a moment.';
    }
    
    return sendError(res, errorMessage, 500);
  }
}));

export default router;
