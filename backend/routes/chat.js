import express from 'express';
import Chat from '../models/Chat.js';
import AIChat from '../models/AIChat.js';
import Course from '../models/Course.js';
import { authenticateToken } from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Get all chats for the authenticated user
router.get('/chats', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();
    
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// Create a new chat
router.post('/chats', authenticateToken, async (req, res) => {
  try {
    const { messages, title } = req.body;
    
    const chat = new Chat({
      userId: req.user.id,
      messages,
      title: title || 'New Chat'
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Failed to create chat' });
  }
});

// Update a chat
router.put('/chats/:id', authenticateToken, async (req, res) => {
  try {
    const { messages, title } = req.body;
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user.id });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    chat.messages = messages;
    if (title) chat.title = title;
    
    await chat.save();
    res.json(chat);
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ message: 'Failed to update chat' });
  }
});

// Delete a chat
router.delete('/chats/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Chat.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!result) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Failed to delete chat' });
  }
});

// Get a specific chat
router.get('/chats/:id', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    }).lean();

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Failed to fetch chat' });
  }
});

// Chat endpoint for AI responses
router.post('/ai', authenticateToken, async (req, res) => {
  try {
    const { message, courseId, quizScore, totalQuestions } = req.body;
    const userId = req.user.id;

    // If this is a quiz review, get the course name
    let courseName = '';
    if (courseId) {
      const course = await Course.findById(courseId);
      courseName = course ? course.name : 'Unknown Course';
    }

    // Generate AI response
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    let prompt = message;
    if (quizScore !== undefined && totalQuestions !== undefined) {
      prompt = `Context: User just completed a quiz in ${courseName} with score ${quizScore}/${totalQuestions}.\n\nUser message: ${message}`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiMessage = response.text();

    // Save chat message
    const chat = new AIChat({
      userId,
      messages: [
        { role: 'user', content: message },
        { role: 'assistant', content: aiMessage }
      ],
      type: courseId ? 'quiz_review' : 'general',
      metadata: courseId ? { courseName, quizScore, totalQuestions } : {}
    });
    await chat.save();

    res.json({ message: aiMessage });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Get chat history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await AIChat.find({ userId })
      .sort({ lastUpdated: -1 })
      .limit(50);
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get single chat
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const chat = await AIChat.findOne({ _id: req.params.id, userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Update chat
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { messages } = req.body;
    
    const chat = await AIChat.findOne({ _id: req.params.id, userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.messages = messages;
    chat.lastUpdated = Date.now();
    await chat.save();

    res.json(chat);
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// Delete chat
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const chat = await AIChat.findOneAndDelete({ _id: req.params.id, userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

export default router;
