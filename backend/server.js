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

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get environment variables
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const app = express();

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://epsilora.vercel.app',
      'https://epsilora-chaman-ss-projects.vercel.app',
      'https://epsilora-git-master-chaman-ss-projects.vercel.app',
      'https://epsilora-8f6lvf0o2-chaman-ss-projects.vercel.app',
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:5173'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests) 
    // or any Vercel deployment URL
    if (!origin) {
      callback(null, true); // Allow requests with no origin
    } else if (
        allowedOrigins.includes(origin) || 
        /^https:\/\/epsilora-.*-chaman-ss-projects\.vercel\.app$/.test(origin) ||
        /^https:\/\/epsilora.*\.vercel\.app$/.test(origin)) {
      callback(null, origin); // Reflect the request origin in the response
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add additional headers for CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Never use wildcard with credentials
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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

// Lazy initialization for non-critical components
let genAI = null;
let mongoConnected = false;

// MongoDB connection as a separate function that can be called on-demand
const connectToMongoDB = async () => {
  if (mongoConnected) return true; // Skip if already connected
  
  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Simplified connection options optimized for serverless
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      // These options are important for serverless environments
      bufferCommands: false, // Don't buffer commands when not connected
      autoCreate: false, // Don't create indexes automatically
      // Set max pool size low to avoid connection issues
      maxPoolSize: 5
    };
    
    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    console.log('Connected to MongoDB successfully');
    mongoConnected = true;
    
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    mongoConnected = false;
    return false;
  }
};

// Lazy-loaded Gemini initialization that only happens when needed
const getGeminiAI = async () => {
  if (genAI) return genAI; // Return existing instance if available
  
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not found in environment variables');
    return null;
  }

  try {
    console.log('Initializing Gemini AI...');
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    return genAI;
  } catch (error) {
    console.error('Error initializing Gemini AI:', error);
    return null;
  }
};

// Authentication middleware with on-demand MongoDB connection
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    // Connect to MongoDB first if needed
    if (!mongoConnected) {
      const connected = await connectToMongoDB();
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

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

// Modified login endpoint with on-demand MongoDB connection and optimized flow
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', new Date().toISOString());
    const { email, password } = req.body;

    // Validate input immediately before any DB operations
    if (!email || !password) {
      console.log('Login attempt failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Connect to MongoDB only when needed and for each request
    const connected = await connectToMongoDB();
    if (!connected) {
      return res.status(503).json({ 
        message: 'Database service unavailable',
        error: 'Unable to connect to database'
      });
    }

    // Find user
    console.log(`Attempting to find user with email: ${email}`);
    const user = await User.findOne({ email }).lean();

    if (!user) {
      console.log(`Login attempt failed: No user found for email ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log(`Login attempt failed: Invalid password for email ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if JWT_SECRET is properly set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not found in environment variables, using fallback');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`Login successful for user: ${email}`);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Send an appropriate error response
    res.status(500).json({ 
      message: 'Login failed',
      error: error.message 
    });
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
    // Update the entire messages array instead of using $push
    const chatHistory = await ChatHistory.findOneAndUpdate(
      { _id: req.params.chatId, userId: req.user.id },
      { messages: req.body.messages },
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

// Add endpoint to get specific chat history by ID
app.get('/api/chat-history/:chatId', authenticateToken, async (req, res) => {
  try {
    const chatHistory = await ChatHistory.findOne({
      _id: req.params.chatId,
      userId: req.user.id
    });
    
    if (!chatHistory) {
      return res.status(404).json({ error: 'Chat history not found' });
    }
    
    res.json(chatHistory);
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

// Utility function for exponential backoff retry
async function retryOperation(operation, maxRetries = 3, initialDelay = 1000) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      // Check if error is retriable
      const retriableErrors = [
        'ECONNABORTED', 
        'ECONNRESET', 
        'ETIMEDOUT', 
        'Service Unavailable', 
        'Too Many Requests'
      ];

      const isRetriableError = retriableErrors.some(errorType => 
        error.message.includes(errorType)
      );

      if (!isRetriableError || retries === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const delay = initialDelay * Math.pow(2, retries);
      console.log(`Retry attempt ${retries + 1}: Waiting ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
  throw new Error('Max retries exceeded');
}

const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-001:generateContent";

// Main AI Assist Endpoint
app.post('/api/super-simple-ai', authenticateToken, async (req, res) => {
  console.log('AI assist request received:', new Date().toISOString());
  
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    const apiKey = GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const lastMessage = messages[messages.length - 1];
    console.log('Processing message:', lastMessage.content.substring(0, 100));

    // Enhanced prompt to encourage more interactive and colorful responses
    const enhancedPrompt = `
You are an engaging and helpful AI assistant. Please provide a response that is:
1. Well-formatted with markdown
2. Uses emojis where appropriate
3. Includes colorful formatting (using markdown)
4. Structures information in an easy-to-read way
5. Uses bullet points, numbered lists, or tables when relevant
6. Highlights important information with bold or italics
7. Uses code blocks with syntax highlighting when showing code

Here's the user's message: ${lastMessage.content}

Remember to:
- Use **bold** for emphasis
- Add relevant emojis
- Structure your response with clear headings
- Use \`code\` formatting for technical terms
- Include examples in \`\`\`language\n code blocks \`\`\` when relevant
`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-001" });
      
      const result = await model.generateContent({
        contents: [{ parts: [{ text: enhancedPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      });

      if (!result || !result.response) {
        throw new Error('No response from AI model');
      }

      const text = result.response.text();
      
      // Process the response to ensure markdown is preserved
      const processedResponse = text
        .replace(/\\n/g, '\n')  // Preserve newlines
        .replace(/\\`/g, '`')   // Preserve code blocks
        .replace(/\\\*/g, '*')  // Preserve bold/italic
        .trim();

      console.log('Successfully generated interactive response');
      return res.json({ 
        message: processedResponse,
        format: 'markdown'  // Indicate to frontend that response contains markdown
      });

    } catch (error) {
      console.error('AI Generation Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        error: 'Failed to generate content',
        details: error.message,
        suggestion: 'Please try again in a moment'
      });
    }
  } catch (error) {
    console.error('General Error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message
    });
  }
});

// Quiz Generation Route with Enhanced Error Handling
app.post('/api/generate-quiz', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  // Set CORS headers immediately to ensure they're always sent even on timeout
  res.header('Access-Control-Allow-Origin', 'https://epsilora.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  console.log('Quiz generation started:', new Date().toISOString());
  
  try {
    const { courseId, numberOfQuestions, difficulty, timePerQuestion } = req.body;
    
    // Allow larger question sets as requested (since user is willing to wait)
    const maxQuestions = 30; // Support up to 30 questions since user is willing to wait
    const actualNumberOfQuestions = Math.min(numberOfQuestions, maxQuestions);
    
    // Log if we're limiting questions
    if (numberOfQuestions > maxQuestions) {
      console.log(`Limiting questions from ${numberOfQuestions} to ${maxQuestions}`);
    }

    // Short-circuit validation to respond faster
    if (!courseId || !actualNumberOfQuestions || !difficulty) {
      return res.status(400).json({ 
        message: 'Missing required parameters',
        details: {
          courseId: !!courseId,
          numberOfQuestions: !!actualNumberOfQuestions,
          difficulty: !!difficulty
        }
      });
    }

    // Check if API key is available
    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not found');
      return res.status(500).json({
        message: 'Server configuration error',
        error: 'API key not configured'
      });
    }
    
    // No timeout guard - let the request run to completion
    // since the user has indicated they're willing to wait
    
    // Connect to MongoDB on-demand
    if (!mongoConnected) {
      const connected = await connectToMongoDB();
      if (!connected) {
        return res.status(503).json({ 
          message: 'Database service unavailable',
          error: 'Unable to connect to database'
        });
      }
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Create an optimized prompt for Gemini
    const promptText = `Create ${actualNumberOfQuestions} multiple choice questions about "${course.name}" at ${difficulty} difficulty. Format: [{question,options:[A,B,C,D],correctAnswer}]. Be concise.`;

    console.log(`Generating ${actualNumberOfQuestions} questions at ${difficulty} difficulty`);
    
    try {
      // Use the API key as a query parameter with extended timeout
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-001:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptText }]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048, // Maximum allowed tokens
            topP: 0.9,
            topK: 40
          }
        }),
        // Extended timeout - 30 seconds to allow for larger question sets
        timeout: 30000
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0]?.content?.parts[0]?.text;

      if (!generatedText) {
        throw new Error('No content generated from the API');
      }

      // Clean and parse the response with better error handling
      let cleanedText = generatedText
        .replace(/```(json)?/g, '')
        .replace(/[\n\r\t]/g, ' ')
        .trim();
        
      // Handle JSON parsing errors more gracefully
      let questions;
      try {
        // First try to extract JSON if enclosed in markdown
        const jsonMatch = cleanedText.match(/\[(.*)\]/s);
        if (jsonMatch) {
          cleanedText = `[${jsonMatch[1]}]`;
        }
        
        questions = JSON.parse(cleanedText);
        
        // Ensure we have the right structure
        if (!Array.isArray(questions)) {
          throw new Error('Not a valid array of questions');
        }
      } catch (parseError) {
        console.error('JSON Parsing Error:', parseError);
        // Try a more aggressive JSON extraction as a fallback
        try {
          const bracketMatch = cleanedText.match(/\[.*\]/s);
          if (bracketMatch) {
            questions = JSON.parse(bracketMatch[0]);
            if (!Array.isArray(questions)) {
              throw new Error('Extracted content is not an array');
            }
          } else {
            throw new Error('No JSON array found in the response');
          }
        } catch (fallbackError) {
          console.error('Fallback parsing failed:', fallbackError);
          return res.status(500).json({
            message: 'Failed to parse generated quiz data',
            error: 'Internal processing error'
          });
        }
      }
      
      // Format and validate each question
      const formattedQuestions = questions
        .slice(0, actualNumberOfQuestions) // Ensure we don't exceed the requested number
        .map((q, index) => {
          // Validate and normalize the question format
          const options = Array.isArray(q.options) ? 
            q.options.map(opt => opt.trim()) : 
            ["Option A", "Option B", "Option C", "Option D"]; // Default if missing
            
          const correctAnswer = q.correctAnswer ? 
            q.correctAnswer.trim().toUpperCase() : "A"; // Default if missing
            
          return {
            id: index + 1,
            question: q.question?.trim() || `Question ${index + 1}`,
            options: options.slice(0, 4), // Ensure exactly 4 options
            correctAnswer: correctAnswer,
            timePerQuestion
          };
        });

      // Log completion and return the result
      console.log(`Quiz generation completed in ${Date.now() - startTime}ms`);
      return res.json(formattedQuestions);
      
    } catch (error) {
      console.error('Quiz Generation Error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          message: 'Failed to generate quiz',
          error: error.message || 'An unexpected error occurred during quiz generation'
        });
      }
    }
  } catch (error) {
    console.error('Quiz generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Error generating quiz',
        error: error.message || 'An unexpected error occurred'
      });
    }
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

// Super Simple AI Assist Endpoint - Last Resort Approach
app.post('/api/super-simple-ai', authenticateToken, async (req, res) => {
  console.log('Simple AI assist endpoint called:', new Date().toISOString());
  
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Extract API key
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('API Key prefix:', apiKey ? apiKey.substring(0, 7) : 'none');
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const lastMessage = messages[messages.length - 1];
    console.log('Processing user message:', lastMessage.content.substring(0, 30) + '...');

    // Hard-coded to use v1 API version with new model
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-001:generateContent?key=${apiKey}`;
    console.log('Using API URL:', apiUrl.replace(apiKey, '[REDACTED]'));
    
    try {
      // Simple, minimal request to the API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: lastMessage.content }] }]
        })
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `API error: ${response.status} ${response.statusText}`;
        let responseBody = '';
        
        try {
          const errorJson = await response.json();
          responseBody = JSON.stringify(errorJson);
          console.error('Error response:', errorJson);
        } catch (e) {
          responseBody = await response.text();
          console.error('Error response text:', responseBody);
        }
        
        return res.status(500).json({ 
          error: 'Failed to generate content',
          details: errorMessage,
          responseBody,
          suggestion: 'Please check your API key and make sure it has access to Gemini API'
        });
      }
      
      // Parse successful response
      const data = await response.json();
      console.log('Response received successfully');
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        console.error('Invalid response format:', JSON.stringify(data).substring(0, 200));
        return res.status(500).json({
          error: 'Invalid API response',
          details: 'Response did not contain the expected content format'
        });
      }
      
      const generatedText = data.candidates[0].content.parts[0].text;
      console.log('Successfully generated text, length:', generatedText.length);
      
      return res.json({ message: generatedText });
    } catch (error) {
      console.error('Error making API request:', error);
      return res.status(500).json({
        error: 'Request failed',
        details: error.message,
        stack: error.stack
      });
    }
  } catch (error) {
    console.error('General error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Test endpoint to list available models
app.get('/api/list-models', async (req, res) => {
  console.log('Attempting to list available models...');
  
  // Get origin from the request
  const origin = req.headers.origin;
  
  // Only set CORS headers if origin is valid
  if (origin) {
    const allowedOrigins = [
      'https://epsilora.vercel.app',
      'https://epsilora-chaman-ss-projects.vercel.app',
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:5173'
    ];
    
    // Check if origin is allowed or matches pattern
    if (allowedOrigins.includes(origin) || 
        /^https:\/\/epsilora-.*-chaman-ss-projects\.vercel\.app$/.test(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Credentials', 'true');
    }
  }
  
  try {
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('No API key found');
      return res.status(500).json({ error: 'API key not configured' });
    }
    console.log('Using API key:', apiKey.substring(0, 10) + '...');

    // Try v1 first
    try {
      const v1Url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
      console.log('Trying v1 endpoint:', v1Url.replace(apiKey, '[REDACTED]'));
      
      const v1Response = await fetch(v1Url);
      console.log('V1 response status:', v1Response.status);
      
      if (v1Response.ok) {
        const data = await v1Response.json();
        console.log('V1 Models found:', data);
        return res.json({ 
          version: 'v1', 
          models: data,
          message: 'Successfully retrieved models from v1 endpoint'
        });
      }
      
      const v1Error = await v1Response.text();
      console.log('V1 error response:', v1Error);
    } catch (v1Error) {
      console.error('Error with v1:', v1Error);
    }

    // Try v1beta as fallback
    const v1betaUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log('Trying v1beta endpoint:', v1betaUrl.replace(apiKey, '[REDACTED]'));
    
    const v1betaResponse = await fetch(v1betaUrl);
    console.log('V1beta response status:', v1betaResponse.status);

    if (!v1betaResponse.ok) {
      const error = await v1betaResponse.text();
      console.error('V1beta error response:', error);
      return res.status(500).json({ 
        error: 'Failed to list models',
        v1betaError: error,
        message: 'Both v1 and v1beta endpoints failed'
      });
    }

    const data = await v1betaResponse.json();
    console.log('V1beta Models found:', data);
    return res.json({ 
      version: 'v1beta', 
      models: data,
      message: 'Successfully retrieved models from v1beta endpoint'
    });

  } catch (error) {
    console.error('General error listing models:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      message: 'Unexpected error while listing models'
    });
  }
});

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation error',
      details: err.message
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: 'Invalid token',
      details: err.message
    });
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(503).json({ 
      message: 'Database error',
      details: 'There was an issue connecting to the database'
    });
  }
  
  res.status(500).json({ 
    message: 'Something went wrong on the server',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Error handling middleware
app.use(errorHandler);

app.use('/api/progress', progressRoutes);

// Start server only in local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel serverless deployment
export default app;

// Update error handling to use new retry mechanism
async function generateQuizWithRetry() {
  try {
    // Use the new method for quiz generation
    const quizContent = await retryOperation(async () => {
      // Quiz generation logic here
    });
    return quizContent;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    geminiAI: genAI ? 'initialized' : 'not initialized'
  };
  
  res.status(200).json(health);
});

// Root endpoint for basic verification
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Epsilora Backend API is running',
    timestamp: new Date().toISOString()
  });
});
