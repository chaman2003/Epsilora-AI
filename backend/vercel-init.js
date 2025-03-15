// This file is a lightweight initialization script for Vercel
// It helps ensure the serverless function wakes up quickly

import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a minimal express app
const app = express();

// Basic JSON middleware
app.use(express.json());

// Health check endpoint for immediate response
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

// Export handler for Vercel
export default app; 