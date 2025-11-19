import React, { useMemo, useState } from 'react';
import { Exam, Responses, QuestionType, Answer, StudentResponse } from '../types';
import { useAuth } from '../context/AuthContext';

interface ResultsPageProps {
  exam: Exam;
  responses: Responses;
  timeTaken: number; // in seconds
  retakeCount: number;
  onRetake: () => void;
  onBackToDashboard: () => void;
  onViewCertificate: () => void;
}

const PASSING_PERCENTAGE = 70;

const ResultsPage: React.FC<ResultsPageProps> = ({ exam, responses, timeTaken, retakeCount, onRetake, onBackToDashboard, onViewCertificate }) => {
  const { logout } = useAuth();

  const results = useMemo(() => {
    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    let pendingManualGrade = 0;

    const detailedResponses: StudentResponse[] = exam.questions.map(q => {
      maxScore += q.points;
      const answer = responses[q.id];
      let isCorrect: boolean | null = null;
      let questionScore = 0;

      if (q.questionType === QuestionType.Essay || q.questionType === QuestionType.ShortAnswer) {
          isCorrect = null; // Needs manual grading
          pendingManualGrade++;
      } else if (answer !== undefined) {
          if(Array.isArray(q.correctAnswer) && Array.isArray(answer)) {
            const correctSet = new Set(q.correctAnswer);
            const answerSet = new Set(answer);
            isCorrect = correctSet.size === answerSet.size && [...correctSet].every(id => answerSet.has(id));
          } else {
             isCorrect = JSON.stringify(answer) === JSON.stringify(q.correctAnswer);
          }
      } else {
        isCorrect = false;
      }

      if(isCorrect === true) {
        score += q.points;
        questionScore = q.points;
        correctCount++;
      }

      return { question: q, answer, isCorrect, score: questionScore };
    });

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';
    
    const isPass = percentage >= PASSING_PERCENTAGE;

    return { score, maxScore, percentage, grade, correctCount, pendingManualGrade, detailedResponses, isPass };
  }, [exam, responses]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  const renderAnswer = (answer: Answer, isCorrect: boolean | null, questionType: QuestionType) => {
    if (answer === undefined || (Array.isArray(answer) && answer.length === 0)) {
      return <span className="text-gray-500 italic">Not Answered</span>
    }

    let bgColor = '';
    if (isCorrect === true) bgColor = 'bg-green-900/50';
    else if (isCorrect === false) bgColor = 'bg-red-900/50';
    else bgColor = 'bg-yellow-900/50';

    const text = Array.isArray(answer) ? answer.join(', ') : answer;
    
    return <div className={`p-2 rounded ${bgColor}`}>{text}</div>
  };

  const remainingRetakes = exam.retakeLimit - retakeCount;
  const canRetake = remainingRetakes > 0 && !results.isPass;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-900 text-gray-200">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-2">Exam Completed!</h1>
          <p className="text-lg text-gray-400">Here are your results for "{exam.title}"</p>
        </header>

        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div>
                <p className="text-sm text-gray-400">Score</p>
                <p className="text-3xl font-bold text-sky-400">{results.score}<span className="text-xl text-gray-400">/{results.maxScore}</span></p>
            </div>
            <div>
                <p className="text-sm text-gray-400">Percentage</p>
                <p className="text-3xl font-bold text-sky-400">{results.percentage.toFixed(1)}%</p>
            </div>
            <div>
                <p className="text-sm text-gray-400">Grade</p>
                <p className="text-3xl font-bold text-sky-400">{results.grade}</p>
            </div>
            <div>
                <p className="text-sm text-gray-400">Time Taken</p>
                <p className="text-3xl font-bold text-sky-400">{formatTime(timeTaken)}</p>
            </div>
            <div>
                <p className="text-sm text-gray-400">Result</p>
                 <p className={`text-3xl font-bold ${results.isPass ? 'text-green-400' : 'text-red-400'}`}>
                    {results.isPass ? 'Pass' : 'Fail'}
                </p>
            </div>
        </div>
        
        {results.pendingManualGrade > 0 && 
            <div className="bg-yellow-900/50 text-yellow-300 p-4 rounded-lg text-center mb-8">
                <p><strong>Note:</strong> {results.pendingManualGrade} question(s) require manual grading. Your final score may change.</p>
            </div>
        }

        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Question Review</h2>
                 <div className="flex items-center space-x-4">
                     <div className="text-sm text-gray-400">
                         {canRetake ? `${remainingRetakes} retake(s) remaining.` : results.isPass ? '' : 'No retakes remaining.'}
                     </div>
                      <button onClick={onBackToDashboard} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold">
                        &larr; Back to Dashboard
                     </button>
                     {results.isPass && (
                         <button 
                            onClick={onViewCertificate}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-semibold transition"
                         >
                            View Certificate
                         </button>
                     )}
                     <button 
                        onClick={onRetake} 
                        disabled={!canRetake}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        Retake Exam
                     </button>
                 </div>
            </div>
            <div className="space-y-6">
                {results.detailedResponses.map(({ question, answer, isCorrect, score }, index) => (
                    <div key={question.id} className="border-b border-gray-700 pb-4">
                        <div className="flex justify-between items-start">
                             <p className="font-bold text-lg">{index + 1}. {question.text}</p>
                             <span className={`font-bold px-2 py-1 rounded text-sm ${isCorrect === true ? 'bg-green-500 text-gray-900' : isCorrect === false ? 'bg-red-500 text-gray-900' : 'bg-yellow-500 text-gray-900'}`}>
                                {isCorrect === true ? 'Correct' : isCorrect === false ? 'Incorrect' : 'Pending'}
                             </span>
                        </div>
                        <div className="mt-3 text-sm space-y-2">
                             <p><strong>Your Answer:</strong> {renderAnswer(answer, isCorrect, question.questionType)}</p>
                            {isCorrect === false && (
                                <p><strong>Correct Answer:</strong> {renderAnswer(question.correctAnswer!, true, question.questionType)}</p>
                            )}
                            {question.explanation && (
                                <p className="text-gray-400 italic"><strong>Explanation:</strong> {question.explanation}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;