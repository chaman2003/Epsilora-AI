import React from 'react';

interface QuizLimitNoticeProps {
  selectedQuestionCount: number;
  maxQuestionCount: number;
}

// We're not using the props anymore since the component always returns null
const QuizLimitNotice: React.FC<QuizLimitNoticeProps> = () => {
  // Always return null to hide the component completely, as requested by the user
  return null;

  // The previous implementation that's now disabled:
  /*
  if (selectedQuestionCount <= maxQuestionCount) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-amber-700 font-medium">
            <strong>Quiz Question Limit:</strong> You've selected {selectedQuestionCount} questions, but only the first {maxQuestionCount} will be generated.
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Due to technical limitations on our serverless environment, we limit quiz generation to {maxQuestionCount} questions for reliable performance. This ensures quizzes load quickly and prevents timeouts.
          </p>
        </div>
      </div>
    </div>
  );
  */
};

export default QuizLimitNotice; 