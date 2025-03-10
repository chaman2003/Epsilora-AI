import React from 'react';

interface QuizGenerationOverlayProps {
  loading: boolean;
}

const QuizGenerationOverlay: React.FC<QuizGenerationOverlayProps> = ({ loading }) => {
  if (!loading) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex flex-col items-center justify-center">
      <div className="text-center p-8 rounded-lg bg-white dark:bg-gray-800 shadow-xl max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 relative">
            <div className="animate-spin absolute top-0 left-0 w-full h-full border-8 border-indigo-500 border-t-transparent rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Generating Your Quiz</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We're creating personalized questions based on your selected course and preferences...
        </p>
        <div className="flex justify-center">
          <div className="bg-gray-200 dark:bg-gray-700 w-64 h-3 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          This may take up to 30 seconds
        </p>
      </div>
    </div>
  );
};

export default QuizGenerationOverlay; 