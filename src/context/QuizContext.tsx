import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export interface QuizOption {
  text: string;
  label: string;
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface QuizData {
  courseName: string;
  difficulty: string;
  score: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  timestamp?: string;
}

interface QuizContextProps {
  quizData: QuizData | null;
  setQuizData: (data: QuizData | null) => void;
}

const QUIZ_DATA_KEY = 'quiz_data';
const QuizContext = createContext<QuizContextProps | undefined>(undefined);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state with data from localStorage if available
  const [quizData, setQuizDataState] = useState<QuizData | null>(() => {
    try {
      const storedData = localStorage.getItem(QUIZ_DATA_KEY);
      return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error('Error parsing stored quiz data:', error);
      return null;
    }
  });

  // Clear quiz data when token is not present (user logged out)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setQuizData(null);
    }
  }, []);

  // Wrapper function to update both state and localStorage
  const setQuizData = (data: QuizData | null) => {
    console.log('Setting quiz data in context:', data ? 'data present' : 'null data');
    setQuizDataState(data);
    
    try {
      if (data) {
        const serialized = JSON.stringify(data);
        localStorage.setItem(QUIZ_DATA_KEY, serialized);
        console.log('Quiz data saved to localStorage, first 100 chars:', serialized.substring(0, 100));
      } else {
        localStorage.removeItem(QUIZ_DATA_KEY);
        console.log('Quiz data removed from localStorage');
      }
    } catch (error) {
      console.error('Error saving quiz data to localStorage:', error);
    }
  };

  return (
    <QuizContext.Provider value={{ quizData, setQuizData }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = (): QuizContextProps => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
