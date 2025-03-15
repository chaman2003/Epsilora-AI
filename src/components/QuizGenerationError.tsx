import React from 'react';

interface QuizGenerationErrorProps {
  error: string;
  maxQuestions: number;
  onRetry?: () => void;
}

const QuizGenerationError: React.FC<QuizGenerationErrorProps> = ({
  error,
  maxQuestions,
  onRetry
}) => {
  // Determine if this is a timeout error
  const isTimeoutError = error.toLowerCase().includes('timeout') || 
                         error.toLowerCase().includes('timed out');

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded shadow-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Quiz Generation Failed
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
            
            {isTimeoutError && (
              <div className="mt-2 text-sm">
                <p className="font-semibold">Why did this happen?</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Our quiz generation has a time limit of 10 seconds.</li>
                  <li>Sometimes the server can handle more questions, but response times may vary based on server load.</li>
                  <li>Today, the server might be experiencing higher load or limited resources.</li>
                  <li>For now, try with {maxQuestions} or fewer questions for more reliable results.</li>
                </ul>
              </div>
            )}
          </div>
          
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again with {maxQuestions} Questions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizGenerationError; 