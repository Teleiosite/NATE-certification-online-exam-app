import React, { useState, useMemo } from 'react';
import { Exam, ExamAssignment, SubmissionStatus, QuestionType, Answer, StudentResponse } from '../types';

interface GradingPageProps {
    exam: Exam;
    submissions: ExamAssignment[];
    onUpdateSubmission: (submission: ExamAssignment) => void;
}

const GradingPage: React.FC<GradingPageProps> = ({ exam, submissions, onUpdateSubmission }) => {
    const [selectedSubmission, setSelectedSubmission] = useState<ExamAssignment | null>(null);
    const [filterStatus, setFilterStatus] = useState<SubmissionStatus | 'all'>('all');
    const [manualScores, setManualScores] = useState<Record<string, { score: number, feedback: string }>>({});

    const filteredSubmissions = useMemo(() => {
        if (filterStatus === 'all') return submissions;
        return submissions.filter(s => s.status === filterStatus);
    }, [submissions, filterStatus]);

    const selectSubmission = (submission: ExamAssignment) => {
        setSelectedSubmission(submission);
        // Pre-populate manual scores from existing data if any
    };

    const handleManualScoreChange = (questionId: string, score: number) => {
        setManualScores(prev => ({ ...prev, [questionId]: { ...prev[questionId], score } }));
    };

    const handleFeedbackChange = (questionId: string, feedback: string) => {
        setManualScores(prev => ({ ...prev, [questionId]: { ...prev[questionId], feedback } }));
    };
    
    const handleFinalizeGrade = () => {
        if(!selectedSubmission) return;

        let finalScore = 0;
        selectedSubmission.examId
        exam.questions.forEach(q => {
            const response = selectedSubmission.responses[q.id];
            
            // Auto-graded score
            if (q.questionType === QuestionType.MultipleChoice || q.questionType === QuestionType.MultipleSelect) {
                const isCorrect = JSON.stringify(response) === JSON.stringify(q.correctAnswer);
                if (isCorrect) finalScore += q.points;
            }

            // Manually graded score
            if (manualScores[q.id]) {
                finalScore += manualScores[q.id].score;
            }
        });

        const updatedSubmission: ExamAssignment = {
            ...selectedSubmission,
            score: finalScore,
            status: SubmissionStatus.Graded
        };
        onUpdateSubmission(updatedSubmission);
        setSelectedSubmission(updatedSubmission);
    };

    const getStatusBadge = (status: SubmissionStatus) => {
        switch(status) {
            case SubmissionStatus.Submitted: return 'bg-yellow-500 text-gray-900';
            case SubmissionStatus.Graded: return 'bg-green-500 text-gray-900';
            default: return 'bg-gray-500 text-white';
        }
    }

    const renderSubmissionDetails = () => {
        if (!selectedSubmission) {
            return <div className="flex-grow flex items-center justify-center text-gray-500">Select a submission to view details.</div>
        }
        
        return (
            <div className="flex-grow p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                     <div>
                        <h3 className="text-xl font-bold text-white">{selectedSubmission.student.firstName}'s Submission</h3>
                        <p className="text-sm text-gray-400">{selectedSubmission.student.email}</p>
                    </div>
                     <button onClick={handleFinalizeGrade} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold">Finalize & Release Grade</button>
                </div>

                {selectedSubmission.suspiciousActivityCount > 0 && 
                    <div className="bg-red-900/50 text-red-300 p-3 rounded-lg text-sm text-center mb-4">
                        <p><strong>Warning:</strong> {selectedSubmission.suspiciousActivityCount} suspicious activities detected during this exam.</p>
                    </div>
                }
                
                <div className="space-y-6">
                    {exam.questions.map((q, index) => {
                        const answer = selectedSubmission.responses[q.id];
                        const needsManualGrade = q.questionType === QuestionType.Essay || q.questionType === QuestionType.ShortAnswer;
                        
                        return (
                            <div key={q.id} className="border-b border-gray-700 pb-4">
                                <p className="font-bold">{index + 1}. {q.text} ({q.points} pts)</p>
                                <div className="mt-2 text-sm space-y-2 p-3 bg-gray-900/50 rounded-md">
                                    <p><strong>Student's Answer:</strong> <span className="text-gray-300 italic">{Array.isArray(answer) ? answer.join(', ') : answer || 'Not Answered'}</span></p>
                                    {!needsManualGrade && <p><strong>Correct Answer:</strong> <span className="text-green-400">{Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}</span></p>}
                                </div>
                                {needsManualGrade && (
                                     <div className="mt-3 flex items-center space-x-4">
                                         <label className="text-sm font-semibold">Score:</label>
                                         <input 
                                            type="number" 
                                            max={q.points} 
                                            min={0}
                                            defaultValue={manualScores[q.id]?.score || ''}
                                            onChange={e => handleManualScoreChange(q.id, parseInt(e.target.value))}
                                            className="w-20 p-1 bg-gray-700 border border-gray-600 rounded-md" 
                                         />
                                         <textarea 
                                            placeholder="Add feedback (optional)..." 
                                            defaultValue={manualScores[q.id]?.feedback || ''}
                                            onChange={e => handleFeedbackChange(q.id, e.target.value)}
                                            rows={1}
                                            className="flex-grow p-1 bg-gray-700 border border-gray-600 rounded-md"
                                         />
                                     </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
            {/* Left Panel: Submissions List */}
            <div className="w-full md:w-1/3 lg:w-1/4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 flex flex-col">
                <div className="flex-shrink-0 mb-4">
                    <h2 className="text-lg font-bold text-gray-200">Submissions</h2>
                    <select onChange={e => setFilterStatus(e.target.value as any)} value={filterStatus} className="mt-2 w-full p-2 bg-gray-700 border border-gray-600 rounded-md">
                        <option value="all">All Submissions</option>
                        <option value={SubmissionStatus.Submitted}>Needs Grading</option>
                        <option value={SubmissionStatus.Graded}>Graded</option>
                    </select>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                    {filteredSubmissions.map(sub => (
                        <button key={sub.id} onClick={() => selectSubmission(sub)} className={`w-full text-left p-3 rounded-lg transition ${selectedSubmission?.id === sub.id ? 'bg-sky-800' : 'bg-gray-800 hover:bg-gray-700'}`}>
                            <div className="flex justify-between items-center">
                                <p className="font-semibold">{sub.student.firstName}</p>
                                {sub.score !== null ? <span className="font-bold text-sky-300">{sub.score}/{exam.questions.reduce((sum, q) => sum + q.points, 0)}</span> : <span className="text-xs font-bold px-2 py-1 rounded-full ${getStatusBadge(sub.status)}">Needs Grade</span>}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 flex justify-between">
                                <span>{sub.submittedAt.toLocaleString()}</span>
                                {sub.suspiciousActivityCount > 0 && <span className="text-red-400 font-bold">{sub.suspiciousActivityCount} Flags</span>}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Panel: Grading Interface */}
            <div className="w-full md:w-2/3 lg:w-3/4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg flex flex-col">
                {renderSubmissionDetails()}
            </div>
        </div>
    );
};

export default GradingPage;