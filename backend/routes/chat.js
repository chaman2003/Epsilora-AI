import express from 'express';
import Chat from '../models/Chat.js';
import AIChat from '../models/AIChat.js';
import Course from '../models/Course.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateContent } from '../utils/gemini.js';

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
    const { message, type } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let prompt = message;
    if (type === 'quiz_explanation') {
      prompt = `You are a helpful AI tutor. Please explain the following quiz question and its correct answer in two clear, concise sentences:\n\n${message}`;
    }

    const text = await generateContent(prompt);

    // Save the chat history
    const chat = new AIChat({
      userId: req.user.id,
      message: prompt,
      response: text,
      type: type || 'general'
    });
    await chat.save();

    res.json({ message: text });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ message: 'Failed to generate AI response' });
  }
});

// Save new chat
router.post('/ai/save', authenticateToken, async (req, res) => {
  try {
    const { messages, type = 'general', metadata = {} } = req.body;
    const userId = req.user.id;

    let title = '';
    if (type === 'quiz_review' && metadata.courseName) {
      title = `Quiz Review: ${metadata.courseName}`;
    } else {
      const firstUserMessage = messages.find(m => m.role === 'user');
      title = firstUserMessage ? firstUserMessage.content.slice(0, 50) : 'New Chat';
    }

    const chat = new AIChat({
      userId,
      title,
      messages,
      type,
      metadata
    });

    await chat.save();
    res.json({ success: true, chatId: chat._id });
  } catch (error) {
    console.error('Error saving chat:', error);
    res.status(500).json({ error: 'Failed to save chat' });
  }
});

// Get chat history
router.get('/ai/history', authenticateToken, async (req, res) => {
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
router.get('/ai/:id', authenticateToken, async (req, res) => {
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
router.put('/ai/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { messages } = req.body;
    
    const chat = await AIChat.findOne({ _id: req.params.id, userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.messages = messages;
    if (chat.type === 'general') {
      const firstUserMessage = messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        chat.title = firstUserMessage.content.slice(0, 50);
      }
    }
    chat.lastUpdated = new Date();

    await chat.save();
    res.json(chat);
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// Delete chat
router.delete('/ai/:id', authenticateToken, async (req, res) => {
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

// Chat History Route

export default router;
