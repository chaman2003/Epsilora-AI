import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card } from '@tremor/react';
import { motion } from 'framer-motion';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface Quote {
  text: string;
  author: string;
}

export const QuoteSection = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = 'Generate a short, inspiring quote about learning, education, or personal growth. Return ONLY a JSON object in this exact format: {"text": "quote text", "author": "author name"}. The response must be valid JSON with properly escaped quotes.';
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response text
      let cleanText = text
        .replace(/```json\n?|\n?```/g, '') // Remove markdown code blocks
        .replace(/^[\s\n]+|[\s\n]+$/g, '') // Remove leading/trailing whitespace
        .replace(/\\n/g, '') // Remove newline characters
        .replace(/\n/g, '') // Remove any remaining newlines
        .trim();

      // Additional JSON validation and cleaning
      if (!cleanText.startsWith('{') || !cleanText.endsWith('}')) {
        throw new Error('Invalid JSON format');
      }

      // Fix common JSON formatting issues
      cleanText = cleanText
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Ensure property names are quoted
        .replace(/:\s*([^",\{\}\[\]]+)(,|})/g, ':"$1"$2'); // Ensure string values are quoted

      try {
        const quoteData = JSON.parse(cleanText);
        
        // Validate required fields
        if (!quoteData.text || !quoteData.author || 
            typeof quoteData.text !== 'string' || 
            typeof quoteData.author !== 'string') {
          throw new Error('Missing or invalid required fields');
        }

        // Clean and validate the quote text and author
        const cleanQuote = {
          text: quoteData.text.trim().replace(/^["']|["']$/g, ''),
          author: quoteData.author.trim().replace(/^["']|["']$/g, '')
        };

        // Additional validation
        if (cleanQuote.text.length < 10 || cleanQuote.author.length < 2) {
          throw new Error('Quote or author too short');
        }

        setQuote(cleanQuote);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Raw Text:', cleanText);
        throw new Error('Failed to parse quote data');
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Expanded fallback quotes array
      const fallbackQuotes = [
        {
          text: "The beautiful thing about learning is that no one can take it away from you.",
          author: "B.B. King"
        },
        {
          text: "Education is not the filling of a pail, but the lighting of a fire.",
          author: "W.B. Yeats"
        },
        {
          text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
          author: "Mahatma Gandhi"
        },
        {
          text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
          author: "Dr. Seuss"
        },
        {
          text: "Learning is not attained by chance, it must be sought for with ardor and diligence.",
          author: "Abigail Adams"
        }
      ];
      // Pick a random fallback quote
      const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      setQuote(randomQuote);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      <Card 
        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 cursor-pointer transition-all hover:shadow-lg"
        onClick={fetchQuote}
      >
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-start">
            <p className="text-lg font-medium text-gray-900 dark:text-white italic flex-1">
              "{quote?.text}"
            </p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                fetchQuote();
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Get new quote"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-right">
            - {quote?.author}
          </p>
        </div>
      </Card>
    </motion.div>
  );
};
