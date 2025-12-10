import mongoose from 'mongoose';
import config from './config.js';

let mongoConnected = false;

/**
 * Connect to MongoDB database
 * @returns {Promise<boolean>} Connection status
 */
export const connectToMongoDB = async () => {
  if (mongoConnected) {
    console.log('Already connected to MongoDB');
    return true;
  }
  
  try {
    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(config.mongodbUri, config.mongoOptions);
    console.log('Connected to MongoDB successfully');
    mongoConnected = true;
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      mongoConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      mongoConnected = false;
    });
    
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    mongoConnected = false;
    return false;
  }
};

/**
 * Get MongoDB connection status
 * @returns {boolean} Connection status
 */
export const isConnected = () => mongoConnected;

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
export const disconnectFromMongoDB = async () => {
  if (mongoConnected) {
    await mongoose.disconnect();
    mongoConnected = false;
    console.log('Disconnected from MongoDB');
  }
};

export default { connectToMongoDB, isConnected, disconnectFromMongoDB };
