import React, { useState, useMemo } from 'react';
import { Exam, Role, StudentSubmission } from '../types';
import { useAuth } from '../context/AuthContext';
import TakeExam from './TakeExam';
import Certificate from './Certificate';
import ResultsPage from './ResultsPage';

interface StudentDashboardProps {
    exams: Exam[];
}

const PASSING_PERCENTAGE = 70;

const StudentDashboard: React.FC<StudentDashboardProps> = ({ exams }) => {
    const { user, logout } = useAuth();
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [viewingCertificate, setViewingCertificate] = useState<{ exam: Exam, submission: StudentSubmission } | null>(null);
    const [viewingResults, setViewingResults] = useState<{ exam: Exam, submission: StudentSubmission } | null>(null);

    const departmentalExams = useMemo(() => {
        if (!user || user.role !== Role.Student || !user.department) {
            return [];
        }
        return exams.filter(exam => exam.department === user.department);
    }, [exams, user]);

    const getSubmissionStatus = (examId: string): { status: string; submission: StudentSubmission | null } => {
        const submissionKey = `submission_${user?.id}_${examId}`;
        const savedSubmissionJson = localStorage.getItem(submissionKey);
        if (savedSubmissionJson) {
            try {
                const submission = JSON.parse(savedSubmissionJson) as StudentSubmission;
                if (!submission.score === undefined || !submission.maxScore === undefined) return { status: 'Not Started', submission: null };

                const exam = exams.find(e => e.id === examId);
                const percentage = submission.maxScore > 0 ? (submission.score / submission.maxScore) * 100 : 0;
                const passed = percentage >= PASSING_PERCENTAGE;
                
                if (exam) {
                    const canRetake = submission.retakeCount < exam.retakeLimit;
                    if (passed) {
                        return { status: 'Passed', submission };
                    }
                    if (canRetake) {
                        return { status: 'Failed, Retake available', submission };
                    }
                    return { status: 'Completed (Failed)', submission };
                }
            } catch {
                return { status: 'Not Started', submission: null };
            }
        }
        return { status: 'Not Started', submission: null };
    }

    if (viewingCertificate && user) {
        return <Certificate 
            studentName={user.firstName}
            examTitle={viewingCertificate.exam.title}
            completionDate={viewingCertificate.submission.submissionDate}
            onBack={() => setViewingCertificate(null)}
        />
    }

    if (viewingResults) {
        return <ResultsPage 
            exam={viewingResults.exam} 
            responses={viewingResults.submission.responses}
            timeTaken={viewingResults.submission.timeTaken}
            retakeCount={viewingResults.submission.retakeCount}
            onBackToDashboard={() => setViewingResults(null)}
            onRetake={() => {
                setViewingResults(null);
                setSelectedExam(viewingResults.exam);
            }}
            onViewCertificate={() => {
                setViewingResults(null);
                setViewingCertificate({ exam: viewingResults.exam, submission: viewingResults.submission });
            }}
        />
    }

    if (selectedExam) {
        return <TakeExam exam={selectedExam} onBackToDashboard={() => setSelectedExam(null)} />
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col min-h-screen">
            <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white truncate">Exams for {user?.department}</h1>
                    <p className="text-sm text-gray-400 mt-1">Welcome, {user?.firstName}</p>
                </div>
                <button onClick={logout} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition">
                    Logout
                </button>
            </header>

            <main className="flex-grow overflow-y-auto">
                {departmentalExams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {departmentalExams.map(exam => {
                            const { status, submission } = getSubmissionStatus(exam.id);
                            return (
                                <div key={exam.id} className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between border border-gray-700">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-2">{exam.title}</h2>
                                        <p className="text-sm text-gray-400 mb-4">By {exam.instructorName}</p>
                                        <div className="text-sm text-gray-300 space-y-2">
                                            <p><strong>Duration:</strong> {exam.durationMinutes} minutes</p>
                                            <p><strong>Questions:</strong> {exam.questions.length}</p>
                                            <p><strong>Status:</strong> <span className={`font-semibold ${status === 'Passed' ? 'text-green-400' : status.startsWith('Failed') ? 'text-yellow-400' : 'text-gray-400'}`}>{status}</span></p>
                                        </div>
                                    </div>
                                    <div className="mt-6 w-full space-y-2">
                                        {status === 'Not Started' && (
                                             <button
                                                onClick={() => setSelectedExam(exam)}
                                                className="w-full px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-lg"
                                            >
                                                Start Exam
                                            </button>
                                        )}
                                        {status === 'Passed' && submission && (
                                            <>
                                            <button onClick={() => setViewingResults({ exam, submission })} className="w-full px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold">View Results</button>
                                            <button onClick={() => setViewingCertificate({ exam, submission })} className="w-full px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-500 text-white font-bold">View Certificate</button>
                                            </>
                                        )}
                                        {status === 'Failed, Retake available' && submission && (
                                            <>
                                             <button onClick={() => setViewingResults({ exam, submission })} className="w-full px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold">View Results</button>
                                             <button onClick={() => setSelectedExam(exam)} className="w-full px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-bold">Retake Exam</button>
                                            </>
                                        )}
                                        {status === 'Completed (Failed)' && submission && (
                                             <button onClick={() => setViewingResults({ exam, submission })} className="w-full px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold">View Results</button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        <h2 className="text-2xl font-semibold">No Exams Available</h2>
                        <p className="mt-2">There are currently no exams scheduled for the {user?.department} department.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentDashboard;