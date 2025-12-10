import config from './config.js';

/**
 * CORS configuration options
 */
export const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = config.allowedOrigins;
    
    // Allow requests with no origin (like mobile apps or curl requests) 
    // or any Vercel deployment URL
    if (!origin) {
      callback(null, true);
    } else if (
        allowedOrigins.includes(origin) || 
        /^https:\/\/epsilora-.*-chaman-ss-projects\.vercel\.app$/.test(origin) ||
        /^https:\/\/epsilora.*\.vercel\.app$/.test(origin)) {
      callback(null, origin);
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

export default corsOptions;
