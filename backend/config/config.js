import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongodbUri: process.env.MONGODB_URI,
  
  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: '24h',
  bcryptSaltRounds: 10,
  
  // Gemini AI
  geminiApiKey: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
  
  // CORS
  allowedOrigins: [
    'https://epsilora.vercel.app',
    'https://epsilora-chaman-ss-projects.vercel.app',
    'https://epsilora-git-master-chaman-ss-projects.vercel.app',
    'https://epsilora-8f6lvf0o2-chaman-ss-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  
  // Timeouts
  requestTimeout: 180000, // 3 minutes
  responseTimeout: 180000, // 3 minutes
  
  // MongoDB Options
  mongoOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    bufferCommands: false,
    autoCreate: false,
    maxPoolSize: 5
  }
};

export default config;
