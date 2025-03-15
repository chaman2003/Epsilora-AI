import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import '../server.js'; // Import the main server file

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Create a simple route to check if the API is running
app.get('/', (req, res) => {
  res.json({
    message: 'Epsilora API is running',
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server
const server = createServer(app);

// Export the Express API
export default app; 