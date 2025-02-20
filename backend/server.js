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
import { GoogleGenerativeAI } from '@google/generative-ai';
import progressRoutes from './routes/progress.js';
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

// Configure CORS to allow all origins
const corsOptions = {
  origin: true,  // This will allow all origins
  credentials: true,  // Allow credentials such as cookies or authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],  // Allowed headers
  exposedHeaders: ['Content-Range', 'X-Content-Range'],  // Exposed headers for the response
  preflightContinue: false,  // Continue with the request if the preflight request is successful
  optionsSuccessStatus: 204,  // Status code for successful OPTIONS requests
};

// Apply CORS middleware with open configuration
app.use(cors(corsOptions));

// Middleware to handle requests and responses
app.use(express.json());

// Global timeout and error handling middleware
app.use((req, res, next) => {
  // Set global timeouts
  req.setTimeout(180000); // 3 minutes
  res.setTimeout(180000); // 3 minutes

  // Enhanced error handling
  res.handleError = function(error, statusCode = 500) {
    console.error(`Error in ${req.method} ${req.path}:`, error);
    this.status(statusCode).json({
      message: error.message || 'Unexpected server error',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  };

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

// Quiz Generation Route with Enhanced Error Handling
app.post('/api/generate-quiz', authenticateToken, async (req, res) => {
  // Set a longer timeout for this specific route
  req.setTimeout(180000); // 3 minutes
  res.setTimeout(180000);  // 3 minutes

  try {
    const { courseId, numberOfQuestions, difficulty, timePerQuestion } = req.body;

    // Validate input parameters
    if (!courseId || !numberOfQuestions || !difficulty) {
      return res.status(400).json({ 
        message: 'Missing required parameters',
        details: {
          courseId: !!courseId,
          numberOfQuestions: !!numberOfQuestions,
          difficulty: !!difficulty
        }
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Create prompt for Gemini with more robust error handling
    const prompt = `You are a precise quiz generator for the course "${course.name}". 
Generate ${numberOfQuestions} unique multiple choice questions.

Strict Requirements:
1. Create exactly ${numberOfQuestions} questions
2. Difficulty: ${difficulty}
3. Each question MUST have:
   - Exactly 4 options (A, B, C, D)
   - One correct answer
   - Clear, concise wording
4. Ensure NO duplicate questions
5. Questions must be directly related to ${course.name}

Output Format (STRICT JSON ONLY):
[{
  "question": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "A" or "B" or "C" or "D"
}]

CRITICAL: Return ONLY a valid JSON array. NO additional text.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        topP: 0.8,
        topK: 40
      }
    });

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Aggressive text cleaning
      text = text.replace(/```(json)?/g, '')
                 .replace(/[\n\r\t]/g, '')
                 .trim();

      // Validate JSON structure
      let questions;
      try {
        questions = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON Parsing Error:', parseError);
        console.error('Raw text:', text);
        return res.status(500).json({
          message: 'Failed to parse quiz data',
          rawText: text.slice(0, 500), // Limit raw text for safety
          error: parseError.message
        });
      }

      // Validate questions
      if (!Array.isArray(questions)) {
        return res.status(500).json({ 
          message: 'Invalid quiz format',
          details: 'Expected an array of questions'
        });
      }

      if (questions.length !== numberOfQuestions) {
        return res.status(500).json({
          message: 'Incorrect number of questions generated',
          expected: numberOfQuestions,
          actual: questions.length
        });
      }

      // Clean and validate each question
      const validatedQuestions = questions.map((q, index) => {
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || !q.correctAnswer) {
          throw new Error(`Invalid question format at index ${index}`);
        }

        return {
          id: index + 1,
          question: q.question.trim(),
          options: q.options.map(opt => opt.trim()),
          correctAnswer: q.correctAnswer.trim().toUpperCase(),
          timePerQuestion
        };
      });

      res.json(validatedQuestions);

    } catch (aiError) {
      console.error('AI Generation Error:', aiError);
      res.status(500).json({
        message: 'Failed to generate quiz questions',
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    res.status(500).json({
      message: 'Unexpected error in quiz generation',
      error: error.message
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
      averageScore: Math.round(stats[0].averageScore[0]?.averageScore || 0),
      latestScore: Math.round(stats[0].latestQuiz[0]?.latestScore || 0)
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

app.use('/api/progress', progressRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
