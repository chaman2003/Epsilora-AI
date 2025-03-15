// Simple entry point for Vercel deployments
import app from './server.js';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log Vercel environment
console.log(`Starting Vercel deployment - Node version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV}`);

// Define allowed origins
const allowedOrigins = [
  'https://epsilora.vercel.app',
  'https://epsilora-chaman-ss-projects.vercel.app',
  'https://epsilora-git-master-chaman-ss-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

// Check for environment variables - don't log sensitive values, just check
if (!process.env.MONGODB_URI) {
  console.error('WARNING: MONGODB_URI is not set. Database connections will fail!');
}

if (!process.env.JWT_SECRET) {
  console.error('WARNING: JWT_SECRET is not set. Authentication will not work correctly!');
}

if (!process.env.GEMINI_API_KEY && !process.env.VITE_GEMINI_API_KEY) {
  console.error('WARNING: GEMINI_API_KEY is not set. AI features will not work!');
}

// Add explicit CORS middleware at the entry point
// This ensures headers are sent even if there's a timeout
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin) || 
       /^https:\/\/epsilora-.*\.vercel\.app$/.test(origin)) {
      callback(null, origin || '*');
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, 'https://epsilora.vercel.app'); // Default to main domain
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
}));

// Add a direct response handler for preflight requests
app.options('*', (req, res) => {
  // Set CORS headers directly
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', 
    allowedOrigins.includes(origin) || /^https:\/\/epsilora-.*\.vercel\.app$/.test(origin) 
      ? origin 
      : 'https://epsilora.vercel.app'
  );
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).end();
});

// Specific middleware for quiz generation that ensures proper CORS headers
app.use('/api/generate-quiz', (req, res, next) => {
  // Set CORS headers immediately for this specific route
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', 
    allowedOrigins.includes(origin) || /^https:\/\/epsilora-.*\.vercel\.app$/.test(origin) 
      ? origin 
      : 'https://epsilora.vercel.app'
  );
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  next();
});

// Serve the test HTML page at the root
app.get('/', (req, res) => {
  try {
    const htmlPath = path.join(__dirname, 'test.html');
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      res.status(200).send(`
        <html>
          <head>
            <title>Epsilora API Server</title>
            <style>
              body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #4f46e5; }
            </style>
          </head>
          <body>
            <h1>Epsilora API Server</h1>
            <p>The API server is running. Test page not found but server is operational.</p>
            <p>Server time: ${new Date().toISOString()}</p>
            <p>Node version: ${process.version}</p>
            <p><a href="/health">Check Health</a></p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error serving test page:', error);
    res.status(200).send('Epsilora API Server is running. Error displaying test page.');
  }
});

// Add global error handling middleware for Vercel 
app.use((err, req, res, next) => {
  console.error('Vercel deployment error:', err);
  
  // Set CORS headers even for error responses
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', 
    allowedOrigins.includes(origin) || /^https:\/\/epsilora-.*\.vercel\.app$/.test(origin) 
      ? origin 
      : 'https://epsilora.vercel.app'
  );
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    vercelError: true,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Add basic health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    vercel: true,
    node: process.version
  });
});

// Export the Express app for Vercel
export default app; 