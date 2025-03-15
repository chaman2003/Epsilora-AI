import fetch from 'node-fetch';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

console.log('Starting API Check Tool');
console.log('========================');
console.log('Node.js version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'not set');

const checkMongoDB = async () => {
  console.log('\nChecking MongoDB Connection...');
  
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 
      process.env.MONGODB_URI.substring(0, 20) + '...' : 
      'Not defined');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB connection successful');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

const checkGeminiAPI = async () => {
  console.log('\nChecking Gemini API Key...');
  
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  console.log('API Key exists:', apiKey ? 'Yes' : 'No');
  
  if (!apiKey) {
    console.error('❌ Gemini API Key not found in environment variables');
    return false;
  }
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const response = await fetch(url);
    
    if (response.ok) {
      console.log('✅ Gemini API connection successful');
      return true;
    } else {
      const errorData = await response.json();
      console.error('❌ Gemini API response error:', errorData.error?.message || response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Gemini API request failed:', error.message);
    return false;
  }
};

const runChecks = async () => {
  const mongoCheck = await checkMongoDB();
  const geminiCheck = await checkGeminiAPI();
  
  console.log('\nCheck Results:');
  console.log('=============');
  console.log('MongoDB:', mongoCheck ? '✅ PASSED' : '❌ FAILED');
  console.log('Gemini API:', geminiCheck ? '✅ PASSED' : '❌ FAILED');
  
  if (mongoCheck && geminiCheck) {
    console.log('\n✅ All checks passed. Your backend should work correctly.');
  } else {
    console.log('\n❌ Some checks failed. Please fix the issues before deploying.');
  }
  
  // Exit with appropriate code
  process.exit(mongoCheck && geminiCheck ? 0 : 1);
};

runChecks().catch(error => {
  console.error('Error running checks:', error);
  process.exit(1);
}); 