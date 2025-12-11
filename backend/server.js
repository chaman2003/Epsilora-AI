import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import config from './config/config.js';
import { connectToMongoDB } from './config/database.js';
import corsOptions from './config/cors.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import chat from './routes/chat.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import progressRoutes from './routes/progress.js';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(cors(corsOptions));

// Additional CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
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

// Middleware
app.use(express.json());

// Global timeout and error handling middleware
app.use((req, res, next) => {
  req.setTimeout(config.requestTimeout);
  res.setTimeout(config.responseTimeout);

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Epsilora AI Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      courses: '/api/courses',
      quiz: '/api/quiz',
      chat: '/api/chat-history',
      dashboard: '/api/dashboard',
      progress: '/api/progress'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', courseRoutes); // For /api/extract-course
app.use('/api/quiz', quizRoutes);
app.use('/api/generate-quiz', (req, res, next) => {
  // Redirect old endpoint to new one
  req.url = '/generate';
  quizRoutes(req, res, next);
});
app.use('/api/quiz-history', (req, res, next) => {
  // Redirect old endpoint to new quiz history endpoint
  req.url = '/history' + (req.params.userId ? `/${req.params.userId}` : '');
  quizRoutes(req, res, next);
});
app.use('/api/chat-history', chatRoutes);
app.use('/api/chats', chat);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/progress', progressRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' && { stack: error.stack })
  });
});

// Initialize database connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Start server
    if (config.nodeEnv !== 'production') {
      app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
        console.log(`Environment: ${config.nodeEnv}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// For local development
if (config.nodeEnv !== 'production') {
  startServer();
}

// Export for Vercel serverless
export default app;
