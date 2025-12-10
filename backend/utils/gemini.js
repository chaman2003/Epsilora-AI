import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config.js';

let genAI = null;

/**
 * Initialize and get Gemini AI instance
 * @returns {Promise<GoogleGenerativeAI|null>} Gemini AI instance
 */
export const getGeminiAI = async () => {
  if (genAI) {
    console.log('Using existing genAI instance');
    return genAI;
  }
  
  if (!config.geminiApiKey) {
    console.error('GEMINI_API_KEY not found in environment variables');
    return null;
  }

  try {
    console.log('Initializing Gemini AI with key starting with:', config.geminiApiKey.substring(0, 5) + '...');
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
    console.log('Gemini AI initialized successfully');
    return genAI;
  } catch (error) {
    console.error('Error initializing Gemini AI:', error);
    return null;
  }
};

/**
 * Generate content using Gemini AI
 * @param {string} prompt - The prompt to send to Gemini
 * @param {string} model - Model name (default: gemini-2.0-flash-exp)
 * @returns {Promise<string>} Generated text
 */
export const generateContent = async (prompt, model = config.geminiModel) => {
  try {
    const ai = await getGeminiAI();
    if (!ai) {
      throw new Error('Gemini AI not initialized');
    }
    
    const generativeModel = ai.getGenerativeModel({ model });
    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating content with Gemini:', error);
    throw error;
  }
};

export default { getGeminiAI, generateContent };
