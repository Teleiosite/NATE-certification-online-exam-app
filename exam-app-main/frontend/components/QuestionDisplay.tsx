
import React from 'react';
import { Question, QuestionType, Answer } from '../types';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  currentAnswer: Answer;
  onAnswerChange: (answer: Answer) => void;
  isFlagged: boolean;
  onFlagToggle: () => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  totalQuestions,
  currentAnswer,
  onAnswerChange,
  isFlagged,
  onFlagToggle,
}) => {
  const renderAnswerArea = () => {
    switch (question.questionType) {
      case QuestionType.MultipleChoice:
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label key={option.id} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${currentAnswer === option.id ? 'bg-sky-900/50 border-sky-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={currentAnswer === option.id}
                  onChange={(e) => onAnswerChange(e.target.value)}
                  className="h-5 w-5 text-sky-500 bg-gray-700 border-gray-600 focus:ring-sky-500"
                />
                <span className="ml-4 text-lg text-gray-200">{option.text}</span>
              </label>
            ))}
          </div>
        );
      case QuestionType.MultipleSelect:
        const currentAnswers = (currentAnswer as string[]) || [];
        const handleMultiSelectChange = (optionId: string) => {
          const newAnswers = currentAnswers.includes(optionId)
            ? currentAnswers.filter(id => id !== optionId)
            : [...currentAnswers, optionId];
          onAnswerChange(newAnswers);
        };
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Select all that apply.</p>
            {question.options?.map((option) => (
              <label key={option.id} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${currentAnswers.includes(option.id) ? 'bg-sky-900/50 border-sky-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
                <input
                  type="checkbox"
                  value={option.id}
                  checked={currentAnswers.includes(option.id)}
                  onChange={() => handleMultiSelectChange(option.id)}
                  className="h-5 w-5 text-sky-500 bg-gray-700 border-gray-600 rounded focus:ring-sky-500"
                />
                <span className="ml-4 text-lg text-gray-200">{option.text}</span>
              </label>
            ))}
          </div>
        );
      case QuestionType.ShortAnswer:
        return (
          <input
            type="text"
            value={(currentAnswer as string) || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-lg text-gray-100 focus:ring-sky-500 focus:border-sky-500"
            placeholder="Type your answer here..."
          />
        );
      case QuestionType.Essay:
        return (
          <textarea
            value={(currentAnswer as string) || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="w-full h-64 p-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-lg text-gray-100 focus:ring-sky-500 focus:border-sky-500"
            placeholder="Type your essay here..."
          />
        );
      default:
        return <p className="text-red-500">Unsupported question type.</p>;
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 md:p-8 h-full flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <div className="flex justify-between items-start">
            <div>
              <p className="text-sky-400 font-semibold">Question {questionNumber} of {totalQuestions} ({question.points} points)</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-2 text-white">{question.text}</h2>
            </div>
             <button onClick={onFlagToggle} className={`flex items-center space-x-2 px-3 py-2 text-sm font-semibold rounded-md transition ${isFlagged ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
                <span>{isFlagged ? 'Flagged' : 'Flag for Review'}</span>
            </button>
        </div>
        {question.imageUrl && <img src={question.imageUrl} alt="Question visual aid" className="mt-4 rounded-lg max-h-64 object-contain" />}
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {renderAnswerArea()}
      </div>
    </div>
  );
};

export default QuestionDisplay;
