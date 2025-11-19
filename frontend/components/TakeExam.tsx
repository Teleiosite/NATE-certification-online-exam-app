import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Question, QuestionType, Exam, Responses, Answer, StudentSubmission } from '../types';
import Timer from './Timer';
import QuestionNavigator from './QuestionNavigator';
import QuestionDisplay from './QuestionDisplay';
import Modal from './Modal';
import Toast from './Toast';
import ResultsPage from './ResultsPage';
import { useProctoring } from '../hooks/useProctoring';
import { useAuth } from '../context/AuthContext';
import Certificate from './Certificate';

interface TakeExamProps {
    exam: Exam;
    onBackToDashboard: () => void;
}

const TakeExam: React.FC<TakeExamProps> = ({ exam, onBackToDashboard }) => {
    const { user, logout } = useAuth();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<Responses>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [examFinished, setExamFinished] = useState(false);
    const [proctoringWarning, setProctoringWarning] = useState('');
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [timeTaken, setTimeTaken] = useState(0); // in seconds
    const [retakeCount, setRetakeCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [finalSubmission, setFinalSubmission] = useState<StudentSubmission | null>(null);

    const submissionKey = useMemo(() => `submission_${user?.id}_${exam.id}`, [user, exam.id]);
    
    const logActivity = useCallback((activityType: string) => {
        console.log(`Suspicious Activity Detected: ${activityType}`);
        const message = `Warning: ${activityType.replace(/_/g, ' ')} detected.`;
        setProctoringWarning(message);
    }, []);

    useProctoring(logActivity);

    // Check for saved submission on initial load
    useEffect(() => {
        const savedSubmission = localStorage.getItem(submissionKey);
        if (savedSubmission) {
            try {
                const submissionData = JSON.parse(savedSubmission) as StudentSubmission;
                setResponses(submissionData.responses);
                setTimeTaken(submissionData.timeTaken);
                setRetakeCount(submissionData.retakeCount);
                setFinalSubmission(submissionData);
                if(submissionData.retakeCount <= exam.retakeLimit) {
                    setExamFinished(true);
                }
            } catch (error) {
                console.error("Failed to parse saved submission", error);
                localStorage.removeItem(submissionKey); // Clear corrupted data
            }
        }
        setIsLoading(false);
        setStartTime(new Date());
    }, [submissionKey, exam.retakeLimit]);
    
    // Auto-save logic
    useEffect(() => {
        const interval = setInterval(() => {
            if(Object.keys(responses).length > 0 && !examFinished) {
                console.log('Auto-saving responses...', responses);
            }
        }, 30000); // Auto-save every 30 seconds
        return () => clearInterval(interval);
    }, [responses, examFinished]);

    const handleNext = () => {
        if (exam && currentQuestionIndex < exam.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };
    
    const handleNavigateTo = (index: number) => {
        if (exam && index >= 0 && index < exam.questions.length) {
        setCurrentQuestionIndex(index);
        }
    };
    
    const handleAnswerChange = (answer: Answer) => {
        if (!exam) return;
        const questionId = exam.questions[currentQuestionIndex].id;
        setResponses(prev => ({ ...prev, [questionId]: answer }));
    };
    
    const handleFlagToggle = () => {
        if (!exam) return;
        const questionId = exam.questions[currentQuestionIndex].id;
        setFlaggedQuestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(questionId)) {
            newSet.delete(questionId);
        } else {
            newSet.add(questionId);
        }
        return newSet;
        });
    };
    
    const finishExam = useCallback((currentResponses: Responses) => {
        let duration = 0;
        if(startTime) {
            const endTime = new Date();
            duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
            setTimeTaken(duration);
        }
        
        let calculatedScore = 0;
        let maxScore = 0;
        exam.questions.forEach(q => {
            maxScore += q.points;
            const answer = currentResponses[q.id];
            if (q.questionType !== QuestionType.Essay && q.questionType !== QuestionType.ShortAnswer && answer !== undefined) {
                if (Array.isArray(q.correctAnswer) && Array.isArray(answer)) {
                    const correctSet = new Set(q.correctAnswer);
                    const answerSet = new Set(answer);
                    if (correctSet.size === answerSet.size && [...correctSet].every(id => answerSet.has(id))) {
                        calculatedScore += q.points;
                    }
                } else if (JSON.stringify(answer) === JSON.stringify(q.correctAnswer)) {
                    calculatedScore += q.points;
                }
            }
        });

        const submissionData: StudentSubmission = {
            responses: currentResponses,
            timeTaken: duration,
            retakeCount: retakeCount,
            score: calculatedScore,
            maxScore: maxScore,
            submissionDate: new Date().toLocaleDateString()
        };
        localStorage.setItem(submissionKey, JSON.stringify(submissionData));
        setFinalSubmission(submissionData);
        setExamFinished(true);
    }, [startTime, submissionKey, retakeCount, exam]);

    const handleSubmit = useCallback(() => {
        setIsSubmitting(true);
        console.log('Submitting exam...', responses);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSubmitModalOpen(false);
            finishExam(responses);
        }, 1500);
    }, [finishExam, responses]);

    const handleTimeExpired = useCallback(() => {
        console.log("Time's up! Auto-submitting...");
        if (!examFinished) {
          setResponses(currentResponses => {
              finishExam(currentResponses);
              return currentResponses;
          });
        }
    },[examFinished, finishExam]);
    
    const currentQuestion = useMemo(() => exam?.questions[currentQuestionIndex], [exam, currentQuestionIndex]);

    const handleRetakeExam = () => {
        if (retakeCount < exam.retakeLimit) {
            const newRetakeCount = retakeCount + 1;
            setRetakeCount(newRetakeCount);
            
            const submissionData: Partial<StudentSubmission> = {
                retakeCount: newRetakeCount
            };
            localStorage.setItem(submissionKey, JSON.stringify(submissionData));

            setResponses({});
            setFinalSubmission(null);
            setFlaggedQuestions(new Set());
            setCurrentQuestionIndex(0);
            setExamFinished(false);
            setIsSubmitting(false);
            setStartTime(new Date());
            setTimeTaken(0);
        }
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen text-xl">Loading Exam Data...</div>;
    }
    
    if (examFinished && finalSubmission) {
        return (
            <ResultsPage
                exam={exam}
                responses={finalSubmission.responses}
                timeTaken={finalSubmission.timeTaken}
                retakeCount={finalSubmission.retakeCount}
                onRetake={handleRetakeExam}
                onBackToDashboard={onBackToDashboard}
                onViewCertificate={onBackToDashboard} // In a real app, you might show a modal or navigate
            />
        );
    }

    return (
        <div className="p-2 sm:p-4 lg:p-6 flex flex-col min-h-screen">
        <Toast message={proctoringWarning} show={!!proctoringWarning} onDismiss={() => setProctoringWarning('')} />
        <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">{exam.title}</h1>
                <p className="text-sm text-gray-400 mt-1">Welcome, {user?.firstName}</p>
            </div>
            <div className="flex items-center space-x-4">
            <Timer initialMinutes={exam.durationMinutes} onTimeExpired={handleTimeExpired} />
            <button 
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white font-bold transition shadow-lg"
            >
                Submit Exam
            </button>
             <button onClick={onBackToDashboard} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition">
                Exit
            </button>
            </div>
        </header>

        <main className="flex-grow flex flex-col md:flex-row gap-4 min-h-0">
            <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
                {currentQuestion && (
                <QuestionDisplay
                    question={currentQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={exam.questions.length}
                    currentAnswer={responses[currentQuestion.id]}
                    onAnswerChange={handleAnswerChange}
                    isFlagged={flaggedQuestions.has(currentQuestion.id)}
                    onFlagToggle={handleFlagToggle}
                />
                )}
                <div className="flex-shrink-0 flex justify-between items-center p-4 mt-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg">
                    <button 
                    onClick={handlePrev} 
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    Previous
                    </button>
                    <div className="text-xs text-gray-400">Use Arrow keys to navigate</div>
                    <button 
                    onClick={handleNext} 
                    disabled={currentQuestionIndex === exam.questions.length - 1}
                    className="px-6 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    Next
                    </button>
                </div>
            </div>
            <aside className="w-full md:w-1/3 lg:w-1/4">
            <QuestionNavigator
                questions={exam.questions}
                currentQuestionIndex={currentQuestionIndex}
                responses={responses}
                flaggedQuestions={flaggedQuestions}
                onNavigate={handleNavigateTo}
            />
            </aside>
        </main>
        
        <Modal
            isOpen={isSubmitModalOpen}
            onClose={() => setIsSubmitModalOpen(false)}
            onConfirm={handleSubmit}
            title="Confirm Submission"
            confirmText={isSubmitting ? 'Submitting...' : 'Yes, Submit'}
        >
            <p>Are you sure you want to submit your exam? You will not be able to change your answers after submission.</p>
        </Modal>
        </div>
    );
};

export default TakeExam;