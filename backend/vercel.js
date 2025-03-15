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

// Specific middleware for quiz generation that ensures proper CORS headers
// But without timeout guards since the user is willing to wait
app.use('/api/generate-quiz', (req, res, next) => {
  // Set CORS headers immediately for this specific route
  res.header('Access-Control-Allow-Origin', 'https://epsilora.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // No timeout guard - let the request complete naturally
  // The user is willing to wait for large quizzes
  
  next();
});

// Export the Express app for Vercel
export default app; 