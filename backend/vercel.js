// Simple entry point for Vercel deployments
import app from './server.js';

// Note: CORS is already configured in server.js, so we don't need to add it again here
// Adding it twice can cause conflicts and header issues

// Ensure proper CORS handling for signup and other auth endpoints
app.use('/api/auth/*', (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://epsilora.vercel.app',
    'https://epsilora-chaman-ss-projects.vercel.app',
    'https://epsilora-git-master-chaman-ss-projects.vercel.app',
    'https://epsilora-8f6lvf0o2-chaman-ss-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://localhost:5174'
  ];
  
  // Set appropriate Access-Control-Allow-Origin
  if (origin && (allowedOrigins.includes(origin) || 
      /^https:\/\/epsilora-.*-chaman-ss-projects\.vercel\.app$/.test(origin) ||
      /^https:\/\/epsilora.*\.vercel\.app$/.test(origin))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Allow requests with no origin (like Postman, mobile apps)
    res.header('Access-Control-Allow-Origin', '*');
  } else {
    // Fallback for development - specifically allow localhost:5173
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
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