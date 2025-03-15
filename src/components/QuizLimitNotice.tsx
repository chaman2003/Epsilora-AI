import React from 'react';

interface QuizLimitNoticeProps {
  selectedQuestionCount: number;
  maxQuestionCount: number;
}

const QuizLimitNotice: React.FC<QuizLimitNoticeProps> = ({ 
  selectedQuestionCount, 
  maxQuestionCount 
}) => {
  if (selectedQuestionCount <= maxQuestionCount) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> You've selected {selectedQuestionCount} questions. 
            Generating a large number of questions may take longer.
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Please be patient - we'll generate all {selectedQuestionCount} questions for you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuizLimitNotice; 