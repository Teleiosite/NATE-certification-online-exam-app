
import React from 'react';
import { Question } from '../types';

interface QuestionNavigatorProps {
  questions: Question[];
  currentQuestionIndex: number;
  responses: { [key: string]: any };
  flaggedQuestions: Set<string>;
  onNavigate: (index: number) => void;
}

const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentQuestionIndex,
  responses,
  flaggedQuestions,
  onNavigate,
}) => {
  const getStatus = (index: number) => {
    const questionId = questions[index].id;
    const isAnswered = responses[questionId] !== undefined && (Array.isArray(responses[questionId]) ? (responses[questionId] as string[]).length > 0 : responses[questionId] !== '');
    const isFlagged = flaggedQuestions.has(questionId);

    if (isAnswered && isFlagged) return 'bg-green-700/80 border-green-500';
    if (isFlagged) return 'bg-yellow-600/80 border-yellow-400';
    if (isAnswered) return 'bg-sky-700/80 border-sky-500';
    return 'bg-gray-700/80 border-gray-600 hover:border-gray-400';
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 h-full flex flex-col">
      <h3 className="text-lg font-bold mb-4 text-gray-200">Question Navigator</h3>
      <div className="flex-grow overflow-y-auto pr-2">
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => onNavigate(index)}
              className={`
                h-10 w-10 flex items-center justify-center rounded 
                font-bold text-sm transition
                border-2
                ${currentQuestionIndex === index ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white scale-110' : ''}
                ${getStatus(index)}
              `}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400 space-y-2">
        <div className="flex items-center"><div className="w-4 h-4 rounded bg-sky-700 mr-2"></div> Answered</div>
        <div className="flex items-center"><div className="w-4 h-4 rounded bg-yellow-600 mr-2"></div> Flagged</div>
        <div className="flex items-center"><div className="w-4 h-4 rounded bg-green-700 mr-2"></div> Answered & Flagged</div>
        <div className="flex items-center"><div className="w-4 h-4 rounded bg-gray-700 mr-2"></div> Unanswered</div>
      </div>
    </div>
  );
};

export default QuestionNavigator;
