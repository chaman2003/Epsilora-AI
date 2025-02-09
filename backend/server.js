import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import User from './models/User.js';
import Course from './models/Course.js';
import Quiz from './models/Quiz.js'; // Import Quiz model
import QuizAttempt from './models/QuizAttempt.js';
import Chat from './models/Chat.js';
import AIChat from './models/AIChat.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import progressRoutes from './routes/progress.js';
import chatRoutes from './routes/chat.js';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Get environment variables
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Initialize Gemini AI
let genAI;
try {
  if (!GEMINI_API_KEY) {
    console.error('Warning: VITE_GEMINI_API_KEY not found in environment variables');
  } else {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('Gemini AI initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Gemini AI:', error);
}

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://epsilora.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// MongoDB connection with retry logic
const connectDB = async (retries = 5) => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/epsilora';
  console.log('Attempting to connect to MongoDB...');
  
  // Add mongoose debug logging
  mongoose.set('debug', true);
  
  while (retries > 0) {
    try {
      console.log(`Connection attempt ${6 - retries}/5`);
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 2000,
        family: 4 // Force IPv4
      });
      
      // Test the connection
      await mongoose.connection.db.admin().ping();
      console.log('MongoDB Connected Successfully');
      
      // Add connection event listeners
      mongoose.connection.on('error', err => {
        console.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
      });
      
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt failed (${retries} retries left):`, {
        message: err.message,
        code: err.code,
        name: err.name,
        stack: err.stack
      });
      
      retries -= 1;
      if (retries === 0) {
        console.error('All connection attempts failed. Last error:', err);
        throw new Error('Failed to connect to MongoDB after multiple attempts');
      }
      console.log('Waiting 5 seconds before next retry...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Initialize MongoDB connection
(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Fatal: Could not connect to MongoDB:', {
      message: err.message,
      code: err.code,
      name: err.name,
      stack: err.stack
    });
    process.exit(1);
  }
})();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Auth Routes
app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Verify token route
app.post('/api/auth/verify-token', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ valid: false });
    }
    res.json({ valid: true, user });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// Protected route to get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Course routes with authentication
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.user.id });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});

app.post('/api/courses', authenticateToken, async (req, res) => {
  try {
    const course = new Course({
      ...req.body,
      userId: req.user.id
    });
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Error creating course', error: error.message });
  }
});

app.delete('/api/courses/:id', authenticateToken, async (req, res) => {
  try {
    await Course.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Error deleting course', error: error.message });
  }
});

// Chat History Schema
const chatHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  messages: [{
    role: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

// Chat History Endpoints
app.get('/api/chat-history', authenticateToken, async (req, res) => {
  try {
    const chatHistories = await ChatHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(chatHistories);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

app.post('/api/chat-history', authenticateToken, async (req, res) => {
  try {
    const newChat = new ChatHistory({
      userId: req.user.id,
      messages: req.body.messages
    });
    await newChat.save();
    res.json(newChat);
  } catch (error) {
    console.error('Error saving chat history:', error);
    res.status(500).json({ error: 'Failed to save chat history' });
  }
});

app.put('/api/chat-history/:chatId', authenticateToken, async (req, res) => {
  try {
    const chatHistory = await ChatHistory.findOneAndUpdate(
      { _id: req.params.chatId, userId: req.user.id },
      { $push: { messages: req.body.message } },
      { new: true }
    );
    res.json(chatHistory);
  } catch (error) {
    console.error('Error updating chat history:', error);
    res.status(500).json({ error: 'Failed to update chat history' });
  }
});

app.delete('/api/chat-history/:chatId', authenticateToken, async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({
      _id: req.params.chatId,
      userId: req.user.id
    });
    res.json({ message: 'Chat history deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    res.status(500).json({ error: 'Failed to delete chat history' });
  }
});

// Chat endpoint
app.post('/api/chat', authenticateToken, async (req, res) => {
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

    res.json({ message: aiMessage });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Save chat
app.post('/api/chat/save', authenticateToken, async (req, res) => {
  try {
    const { messages, type = 'general', metadata = {} } = req.body;
    const userId = req.user.id;

    // Get chat title based on type and content
    let title = '';
    if (type === 'quiz_review' && metadata.courseName) {
      title = `Quiz Review: ${metadata.courseName}`;
    } else {
      // Use the first user message as title
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

// Update chat
app.put('/api/chat/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { messages } = req.body;
    
    // Find the existing chat
    const chat = await AIChat.findOne({ _id: req.params.id, userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Update messages and title
    chat.messages = messages;
    if (chat.type === 'general') {
      // Update title for general chats based on first user message
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

// Get chat history
app.get('/api/chat/history', authenticateToken, async (req, res) => {
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
app.get('/api/chat/:id', authenticateToken, async (req, res) => {
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

// Delete chat
app.delete('/api/chat/:id', authenticateToken, async (req, res) => {
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

// Quiz Generation Route
app.post('/api/generate-quiz', authenticateToken, async (req, res) => {
  try {
    const { courseId, numberOfQuestions = 10 } = req.body;
    
    // Set a timeout for the entire request
    const TIMEOUT = 240000; // 4 minutes
    let timeoutId = setTimeout(() => {
      res.status(504).json({ error: 'Request timed out. Please try with fewer questions.' });
    }, TIMEOUT);

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      clearTimeout(timeoutId);
      return res.status(404).json({ error: 'Course not found' });
    }

    // Generate quiz with reduced complexity
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048, // Further reduced for faster response
        topP: 0.8,
        topK: 40
      }
    });

    const prompt = `Generate ${numberOfQuestions} multiple choice questions about ${course.name}. Format as JSON array.
Each question should have:
{
  "question": "question text",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "correct option text"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean and parse the response
    text = text.replace(/```json\n?/g, '')
               .replace(/```\n?/g, '')
               .trim();

    const questions = JSON.parse(text);
    
    // Clear the timeout since we got a response
    clearTimeout(timeoutId);
    
    res.json(questions);
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz',
      details: error.message
    });
  }
});

// AI Assistant endpoint
app.post('/api/ai-assist', authenticateToken, async (req, res) => {
  try {
    if (!genAI) {
      throw new Error('Gemini AI not initialized. Check API key configuration.');
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Get the latest user message
    const userMessage = messages[messages.length - 1].content;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(userMessage);
      const response = await result.response;
      const text = response.text();
      
      res.json({ message: text });
    } catch (aiError) {
      console.error('Gemini AI Error:', aiError);
      res.status(500).json({ 
        error: 'AI processing error',
        details: aiError.message 
      });
    }
  } catch (error) {
    console.error('AI Assistant Error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
});

// Dashboard endpoint
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get user's quiz attempts
    const quizAttempts = await Quiz.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(5)
      .populate('courseId', 'name');

    // Get user's course progress
    const courseProgress = await Course.aggregate([
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id',
          foreignField: 'courseId',
          as: 'quizzes'
        }
      },
      {
        $project: {
          courseName: '$name',
          quizzesTaken: { $size: '$quizzes' },
          averageScore: {
            $cond: {
              if: { $gt: [{ $size: '$quizzes' }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      { $sum: '$quizzes.score' },
                      { $sum: '$quizzes.totalQuestions' }
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          },
          progress: {
            $cond: {
              if: { $gt: [{ $size: '$quizzes' }, 0] },
              then: {
                $multiply: [
                  { $divide: [{ $size: '$quizzes' }, 10] }, // Assuming 10 quizzes per course
                  100
                ]
              },
              else: 0
            }
          }
        }
      }
    ]);

    // Get user's AI usage
    const aiUsage = await AIUsage.findOne({ userId: req.user.id }) || {
      tokensUsed: 0,
      conversationCount: 0,
      lastUsed: null
    };

    // Get user's achievements
    const achievements = await Achievement.find({ userId: req.user.id });

    // Format quiz attempts
    const recentQuizzes = quizAttempts.map(quiz => ({
      courseId: quiz.courseId._id,
      courseName: quiz.courseId.name,
      score: quiz.score,
      totalQuestions: quiz.totalQuestions,
      date: quiz.date,
      difficulty: quiz.difficulty
    }));

    res.json({
      recentQuizzes,
      courseProgress: courseProgress.map(course => ({
        courseId: course._id,
        courseName: course.courseName,
        progress: Math.round(course.progress),
        quizzesTaken: course.quizzesTaken,
        averageScore: Math.round(course.averageScore * 10) / 10
      })),
      aiUsage: {
        tokensUsed: aiUsage.tokensUsed,
        lastUsed: aiUsage.lastUsed,
        conversationCount: aiUsage.conversationCount
      },
      achievements: achievements.map(achievement => ({
        id: achievement._id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        earned: achievement.earned,
        earnedDate: achievement.earnedDate
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Quiz History endpoint
app.get('/api/quiz/history', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching quiz history for user:', req.user.id);
    
    // Get quiz history with populated course names
    const quizHistory = await Quiz.find({ userId: req.user.id })
      .populate('courseId', 'name')
      .sort({ date: -1 })
      .limit(10)
      .lean();

    console.log('Found quiz history entries:', quizHistory.length);

    // Format the quiz history
    const formattedHistory = quizHistory.map(quiz => ({
      id: quiz._id.toString(),
      courseId: quiz.courseId._id.toString(),
      courseName: quiz.courseId.name,
      score: quiz.score,
      totalQuestions: quiz.totalQuestions,
      difficulty: quiz.difficulty,
      date: quiz.date,
      timeSpent: quiz.timeSpent,
      percentageScore: (quiz.score / quiz.totalQuestions) * 100
    }));

    console.log('Formatted quiz history:', formattedHistory);
    res.json(formattedHistory);
  } catch (error) {
    console.error('Error in /api/quiz/history:', error);
    res.status(500).json({ 
      message: 'Error fetching quiz history',
      error: error.message 
    });
  }
});

// Save quiz result endpoint
app.post('/api/quiz/save-result', authenticateToken, async (req, res) => {
  try {
    const {
      courseId,
      questions,
      score,
      totalQuestions,
      difficulty,
      timeSpent,
      timePerQuestion
    } = req.body;

    // Validate required fields
    if (!courseId || !questions || score === undefined || !totalQuestions || !difficulty) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'Please provide all required quiz data'
      });
    }

    // Create new quiz
    const quiz = new Quiz({
      userId: req.user.id,
      courseId: courseId,
      score: score,
      totalQuestions: totalQuestions,
      difficulty: difficulty,
      questions: questions.map(q => ({
        question: q.question,
        correctAnswer: q.correctAnswer,
        userAnswer: q.answer,
        isCorrect: q.correct,
        timeSpent: timePerQuestion
      })),
      timeSpent: timeSpent,
      date: new Date()
    });

    await quiz.save();

    // Get updated quiz history
    const updatedHistory = await Quiz.find({ userId: req.user.id })
      .populate('courseId', 'name')
      .sort({ date: -1 })
      .limit(10)
      .lean();

    const formattedHistory = updatedHistory.map(quiz => ({
      id: quiz._id,
      courseId: quiz.courseId._id,
      courseName: quiz.courseId.name,
      score: quiz.score,
      totalQuestions: quiz.totalQuestions,
      difficulty: quiz.difficulty,
      date: quiz.date,
      timeSpent: quiz.timeSpent,
      percentageScore: (quiz.score / quiz.totalQuestions) * 100
    }));

    res.json({
      message: 'Quiz saved successfully',
      quiz: formattedHistory[0],
      history: formattedHistory
    });
  } catch (error) {
    console.error('Error saving quiz:', error);
    res.status(500).json({ message: 'Error saving quiz', error: error.message });
  }
});

// Helper function to calculate improvement from previous attempt
function calculateImprovement(currentQuiz, allQuizzes) {
  // Find the previous quiz for the same course
  const previousQuiz = allQuizzes.find(q => 
    q.courseId._id.toString() === currentQuiz.courseId._id.toString() &&
    q.date < currentQuiz.date
  );

  if (!previousQuiz) return null;

  const currentPercentage = (currentQuiz.score / currentQuiz.totalQuestions) * 100;
  const previousPercentage = (previousQuiz.score / previousQuiz.totalQuestions) * 100;

  return Math.round(currentPercentage - previousPercentage);
}

// Quiz history endpoints
app.get('/api/quiz-history/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify that the requesting user matches the userId parameter
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to quiz history' });
    }

    // Use the existing mongoose connection instead of creating a new one
    const quizHistory = await Quiz.find({ userId })
      .sort({ date: -1 })
      .lean();

    // Calculate total quizzes
    const totalQuizzes = await Quiz.countDocuments({ userId });

    // Calculate statistics
    const stats = await Quiz.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          averageScore: {
            $avg: { $multiply: [{ $divide: ['$score', '$totalQuestions'] }, 100] }
          },
          totalQuizzes: { $sum: 1 }
        }
      }
    ]);

    // Format the response
    const formattedHistory = quizHistory.map(quiz => ({
      ...quiz,
      scorePercentage: Math.round((quiz.score / quiz.totalQuestions) * 100)
    }));

    res.json({
      history: formattedHistory,
      totalQuizzes,
      stats: stats[0] || { averageScore: 0, totalQuizzes: 0 }
    });
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quiz history',
      details: error.message 
    });
  }
});

// Quiz statistics endpoint
app.get('/api/quiz/stats', async (req, res) => {
  let client;
  try {
    const mongoUri = 'mongodb+srv://root:123@epsilora.bikhi.mongodb.net/?retryWrites=true&w=majority&appName=epsilora';
    
    client = await MongoClient.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const db = client.db('test');
    const quizzes = db.collection('quizzes');
    
    // Use MongoDB aggregation to calculate statistics
    const stats = await quizzes.aggregate([
      {
        $facet: {
          totalQuizzes: [
            { $count: 'count' }
          ],
          averageScore: [
            {
              $group: {
                _id: null,
                averageScore: {
                  $avg: {
                    $multiply: [
                      { $divide: ['$score', '$totalQuestions'] },
                      100
                    ]
                  }
                }
              }
            }
          ],
          latestQuiz: [
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
            {
              $project: {
                latestScore: {
                  $multiply: [
                    { $divide: ['$score', '$totalQuestions'] },
                    100
                  ]
                }
              }
            }
          ]
        }
      }
    ]).toArray();

    console.log('MongoDB aggregation result:', stats[0]); // Debug log

    const result = {
      totalQuizzes: stats[0].totalQuizzes[0]?.count || 0,
      averageScore: Math.round(parseFloat(stats[0].averageScore[0]?.averageScore || 0) * 10) / 10,
      latestScore: Math.round(parseFloat(stats[0].latestQuiz[0]?.latestScore || 0) * 10) / 10
    };

    console.log('Final calculated stats:', result);
    
    res.json(result);
  } catch (error) {
    console.error('Error in /api/quiz/stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quiz statistics',
      details: error.message 
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Quiz stats endpoint
app.get('/api/quiz/stats/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify that the requesting user is accessing their own stats
    if (userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all quiz attempts for the user
    const quizAttempts = await QuizAttempt.find({ userId })
      .sort({ createdAt: -1 });

    // Calculate stats
    const stats = {
      totalQuizzes: quizAttempts.length,
      averageScore: 0,
      latestScore: 0
    };

    if (quizAttempts.length > 0) {
      // Calculate average score
      const totalScore = quizAttempts.reduce((sum, quiz) => 
        sum + (quiz.score || 0), 0);
      stats.averageScore = Math.round(totalScore / quizAttempts.length);

      // Get latest score
      stats.latestScore = Math.round(quizAttempts[0].score || 0);
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    res.status(500).json({ message: 'Error fetching quiz statistics' });
  }
});

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: Object.values(err.errors).map(error => error.message).join(', ')
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ 
      message: 'Email already exists'
    });
  }
  
  res.status(500).json({ 
    message: 'Something went wrong on the server'
  });
};

// Error handling middleware
app.use(errorHandler);

// Routes
app.use('/api/progress', progressRoutes);
app.use('/api/chat', chatRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/api/quiz-stats/:courseId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.courseId;

    // Get all quiz attempts for this user and course
    const attempts = await QuizAttempt.find({ userId, courseId })
      .sort({ createdAt: 1 });

    if (!attempts.length) {
      return res.json({
        totalQuizzes: 0,
        averageScore: 0,
        latestScore: 0,
        improvement: 0
      });
    }

    // Calculate stats with forced integer values
    const totalQuizzes = attempts.length;
    const averageScore = Math.floor(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalQuizzes);
    const latestScore = Math.floor(attempts[attempts.length - 1].score);
    const firstScore = Math.floor(attempts[0].score);
    const improvement = Math.floor(((latestScore - firstScore) / firstScore) * 100);

    res.json({
      totalQuizzes,
      averageScore,
      latestScore,
      improvement: isNaN(improvement) ? 0 : improvement
    });
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    res.status(500).json({ error: 'Failed to fetch quiz statistics' });
  }
});
