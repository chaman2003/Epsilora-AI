import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../config/axios';
import { useNavigate } from 'react-router-dom';

interface QuizContextType {
  quizData: any;
  setQuizData: React.Dispatch<React.SetStateAction<any>>;
  clearQuizData: () => void;
  resetQuizData: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quizData, setQuizData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        clearQuizData();
        return;
      }

      try {
        // Get user info from token
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const userId = tokenData.id;

        // Check if we have stored data for this user
        const storedData = localStorage.getItem('quizData');
        const storedUserId = localStorage.getItem('lastUserId');

        // If user changed or no stored data, fetch fresh data
        if (userId !== storedUserId || !storedData) {
          const response = await axiosInstance.get(`/api/quiz-history/${userId}`);
          const userQuizData = response.data;

          setQuizData(userQuizData);
          localStorage.setItem('quizData', JSON.stringify(userQuizData));
          localStorage.setItem('lastUserId', userId);
        } else {
          // Use stored data for the same user
          setQuizData(JSON.parse(storedData));
        }
      } catch (error) {
        console.error('Error initializing user data:', error);
        if (error.response?.status === 401) {
          clearQuizData();
          navigate('/login');
        }
      }
    };

    initializeUserData();
  }, [navigate]);

  const clearQuizData = () => {
    setQuizData(null);
    localStorage.removeItem('quizData');
    localStorage.removeItem('lastUserId');
    localStorage.removeItem('aiAssistMessages');
    localStorage.removeItem('lastQuizData');
  };

  const resetQuizData = () => {
    const emptyData = {
      totalQuizzes: 0,
      averageScore: 0,
      latestScore: 0,
      questions: []
    };
    setQuizData(emptyData);
    localStorage.setItem('quizData', JSON.stringify(emptyData));
  };

  return (
    <QuizContext.Provider value={{ quizData, setQuizData, clearQuizData, resetQuizData }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
