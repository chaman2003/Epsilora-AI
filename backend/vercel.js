// Simple entry point for Vercel deployments
import app from './server.js';
import cors from 'cors';

// Add explicit CORS middleware at the entry point
// This ensures headers are sent even if there's a timeout
app.use(cors({
  origin: ['https://epsilora.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204
}));

// Add a direct response handler for preflight requests
app.options('*', (req, res) => {
  // Set CORS headers directly
  res.header('Access-Control-Allow-Origin', 'https://epsilora.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).end();
});

// Specific error handler for quiz generation that ensures proper CORS headers
app.use('/api/generate-quiz', (req, res, next) => {
  // Set maximum request processing time for quiz generation
  const QUIZ_TIMEOUT = 9000; // 9 seconds (just under Vercel's 10s limit)
  
  // Set CORS headers immediately for this specific route
  res.header('Access-Control-Allow-Origin', 'https://epsilora.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Set up timeout handling specifically for quiz generation
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.log('Quiz generation timeout triggered from vercel.js guardian');
      res.status(504).json({
        message: 'Quiz generation timed out',
        error: 'Please try with 5 or fewer questions',
        maxQuestions: 5,
        timeoutAt: QUIZ_TIMEOUT
      });
    }
  }, QUIZ_TIMEOUT);
  
  // Clean up timeout when the response is sent
  res.on('finish', () => {
    clearTimeout(timeoutId);
  });
  
  next();
});

// Export the Express app for Vercel
export default app; 