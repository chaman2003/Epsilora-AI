import React, { createContext, useState, useContext, ReactNode } from 'react';

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

const QuizContext = createContext<QuizContextProps | undefined>(undefined);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);

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
