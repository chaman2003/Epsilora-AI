// Vercel serverless entry point
// CORS is already configured in server.js
import app from './server.js';

// Export the Express app for Vercel serverless functions
export default app;
 