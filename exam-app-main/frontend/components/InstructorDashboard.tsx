import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateExamPage from './CreateExamPage';
import GradingPage from './GradingPage';
import { Exam, ExamAssignment, QuestionBank, QuestionType, SubmissionStatus, EngineeringDepartment, User, Role } from '../types';

type View = 'builder' | 'grading';
type Tab = 'exams' | 'students';

const mockQuestionBank: QuestionBank = [
    { id: 'qb1', text: 'What is JSX?', questionType: QuestionType.ShortAnswer, points: 5, orderIndex: 0 },
    { id: 'qb2', text: 'React components must be pure functions.', questionType: QuestionType.MultipleChoice, options: [{id: 'qb2o1', text: 'True', isCorrect: true}, {id: 'qb2o2', text: 'False'}], correctAnswer: 'qb2o1', points: 3, orderIndex: 1 },
    { id: 'qb3', text: 'How do you pass data from a parent to a child component?', questionType: QuestionType.ShortAnswer, points: 5, correctAnswer: 'props', orderIndex: 2},
    { id: 'qb4', text: 'What does `useState` return?', questionType: QuestionType.MultipleChoice, options: [{id: 'qb4o1', text: 'A state value and a function to update it', isCorrect: true}, {id: 'qb4o2', text: 'Only the state value'}], correctAnswer: 'qb4o1', points: 5, orderIndex: 3},
];

interface InstructorDashboardProps {
    allExams: Exam[];
    setAllExams: React.Dispatch<React.SetStateAction<Exam[]>>;
    allSubmissions: ExamAssignment[];
    setSubmissions: React.Dispatch<React.SetStateAction<ExamAssignment[]>>;
}

const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ allExams, setAllExams, allSubmissions, setSubmissions }) => {
  const { user, logout, getAllUsers } = useAuth();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [myExams, setMyExams] = useState<Exam[]>(() => allExams.filter(ex => ex.instructorId === user?.id));
  const [view, setView] = useState<View>('builder');
  const [currentTab, setCurrentTab] = useState<Tab>('exams');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [questionBank, setQuestionBank] = useState<QuestionBank>(mockQuestionBank);
  
  const instructorDepartments = useMemo(() => {
    const depts = myExams.map(exam => exam.department);
    return [...new Set(depts)];
  }, [myExams]);

  const allUsers = useMemo(() => getAllUsers(), [getAllUsers]);

  const relevantStudents = useMemo(() => {
    return allUsers.filter(u => u.role === Role.Student && u.department && instructorDepartments.includes(u.department));
  }, [allUsers, instructorDepartments]);

  const needsGradingCount = useMemo(() => {
    if (!selectedExam) return 0;
    return allSubmissions.filter(s => s.examId === selectedExam.id && s.status === SubmissionStatus.Submitted).length;
  }, [allSubmissions, selectedExam]);

  const handleSaveExam = () => {
    if (!selectedExam) return;

    setSaveStatus('saving');
    console.log("Saving exam data:", selectedExam);
    
    // Update local state for this instructor's dashboard
    setMyExams(prevMyExams => {
        const examExists = prevMyExams.some(ex => ex.id === selectedExam.id);
        if (examExists) {
            return prevMyExams.map(ex => ex.id === selectedExam.id ? selectedExam : ex);
        } else {
            return [...prevMyExams, selectedExam];
        }
    });

    // Update global state in App.tsx
    setAllExams(prevAllExams => {
        const examExists = prevAllExams.some(ex => ex.id === selectedExam.id);
        if (examExists) {
            return prevAllExams.map(ex => ex.id === selectedExam.id ? selectedExam : ex);
        } else {
            return [...prevAllExams, selectedExam];
        }
    });
    
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };
  
  const handleUpdateSubmission = (updatedSubmission: ExamAssignment) => {
    setSubmissions(prev => prev.map(s => s.id === updatedSubmission.id ? updatedSubmission : s));
  };
  
  const handleCreateNewExam = () => {
    if (!user) return;
    const newExam: Exam = {
        id: `exam-${Date.now()}`,
        title: 'Untitled Exam',
        durationMinutes: 60,
        retakeLimit: 1,
        questions: [],
        instructorId: user.id,
        instructorName: user.firstName,
        department: EngineeringDepartment.Mechanical, // Default department
    };
    setSelectedExam(newExam);
    setView('builder');
  }

  // Main content for when an exam is selected
  const renderExamEditor = () => {
    if(!selectedExam) return null;
    
    const submissionsForExam = allSubmissions.filter(s => s.examId === selectedExam.id);

    return (
        <>
            <div className="flex-shrink-0 border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                    onClick={() => setView('builder')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${view === 'builder' ? 'border-sky-500 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}
                >
                    Exam Builder
                </button>
                <button
                    onClick={() => setView('grading')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm relative ${view === 'grading' ? 'border-sky-500 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}
                >
                    Grading
                    {needsGradingCount > 0 && (
                    <span className="ml-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {needsGradingCount}
                    </span>
                    )}
                </button>
                </nav>
            </div>
             <main className="flex-grow flex flex-col min-h-0">
                {view === 'builder' ? (
                <CreateExamPage 
                    exam={selectedExam} 
                    onExamChange={setSelectedExam}
                    questionBank={questionBank}
                    onUpdateQuestionBank={setQuestionBank}
                />
                ) : (
                <GradingPage exam={selectedExam} submissions={submissionsForExam} onUpdateSubmission={handleUpdateSubmission} />
                )}
            </main>
        </>
    );
  };

  // View for the exam list, grouped by department
  const ExamsView: React.FC = () => {
    const examsByDepartment = useMemo(() => {
        // FIX: Explicitly type the accumulator `acc` to ensure correct type inference.
        // This prevents the `exams` variable from being inferred as `unknown` later on.
        return myExams.reduce((acc: Record<string, Exam[]>, exam) => {
            const dept = exam.department;
            if (!acc[dept]) {
                acc[dept] = [];
            }
            acc[dept].push(exam);
            return acc;
        }, {});
    }, [myExams]);

    return (
      <div className="flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Exams</h2>
          <button onClick={handleCreateNewExam} className="px-4 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-500 text-white font-semibold transition">
            + Create New Exam
          </button>
        </div>
        <div className="space-y-6 overflow-y-auto pr-2">
          {Object.entries(examsByDepartment).map(([department, exams]) => (
            <div key={department}>
              <h3 className="text-lg font-semibold text-sky-400 mb-2">{department}</h3>
              <div className="space-y-4 border-l-2 border-gray-700 pl-4">
                {exams.map(exam => (
                  <div key={exam.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{exam.title}</p>
                      <p className="text-xs text-gray-400">{exam.questions.length} Questions | {allSubmissions.filter(s => s.examId === exam.id).length} Submissions</p>
                    </div>
                    <div className="space-x-4">
                      <button onClick={() => { setSelectedExam(exam); setView('grading'); }} className="font-medium text-sky-400 hover:underline text-sm">Submissions</button>
                      <button onClick={() => { setSelectedExam(exam); setView('builder'); }} className="font-medium text-green-400 hover:underline text-sm">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {myExams.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <p>You haven't created any exams yet.</p>
              <button onClick={handleCreateNewExam} className="mt-4 font-medium text-sky-400 hover:underline">
                Create your first exam
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // View for student roster
  const StudentsView: React.FC = () => {
    const [studentSearch, setStudentSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');

    const filteredStudents = useMemo(() => {
        return relevantStudents.filter(student => {
            const matchesSearch = student.firstName.toLowerCase().includes(studentSearch.toLowerCase()) || student.email.toLowerCase().includes(studentSearch.toLowerCase());
            const matchesDept = departmentFilter === 'all' || student.department === departmentFilter;
            return matchesSearch && matchesDept;
        });
    }, [relevantStudents, studentSearch, departmentFilter]);

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 flex-grow flex flex-col">
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-200">Student Roster ({filteredStudents.length})</h2>
                <div className="flex items-center space-x-2">
                    <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm">
                        <option value="all">All My Departments</option>
                        {instructorDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                    <input type="text" placeholder="Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm" />
                </div>
            </div>
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Department</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {filteredStudents.map(student => (
                            <tr key={student.id} className="hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{student.firstName}</td>
                                <td className="px-6 py-4">{student.email}</td>
                                <td className="px-6 py-4">{student.department}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredStudents.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <p>No students found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
  };
  
  const renderDashboardContent = () => {
      switch(currentTab) {
          case 'exams':
              return <ExamsView />;
          case 'students':
              return <StudentsView />;
          default:
              return null;
      }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col min-h-screen">
      <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
            {selectedExam && (
                <button onClick={() => setSelectedExam(null)} className="text-gray-400 hover:text-white transition" title="Back to my exams">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
                </button>
            )}
            <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">{selectedExam ? selectedExam.title : "Instructor Dashboard"}</h1>
                <p className="text-sm text-gray-400 mt-1">Welcome, {user?.firstName} (Instructor)</p>
            </div>
        </div>
        <div className="flex items-center space-x-4">
          {selectedExam && (
            <button
                onClick={handleSaveExam}
                disabled={saveStatus !== 'idle'}
                className={`px-4 py-2 w-28 text-center rounded-md text-white font-bold transition shadow-lg ${saveStatus === 'saved' ? 'bg-green-600' : 'bg-sky-600 hover:bg-sky-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Exam'}
            </button>
          )}
          <button onClick={logout} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition">
            Logout
          </button>
        </div>
      </header>

        {selectedExam ? renderExamEditor() : (
            <>
                <div className="flex-shrink-0 border-b border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setCurrentTab('exams')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${currentTab === 'exams' ? 'border-sky-500 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}
                        >
                            Exams
                        </button>
                        <button
                            onClick={() => setCurrentTab('students')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${currentTab === 'students' ? 'border-sky-500 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}
                        >
                            Students
                        </button>
                    </nav>
                </div>
                 <main className="flex-grow flex flex-col min-h-0">
                    {renderDashboardContent()}
                 </main>
            </>
        )}
    </div>
  );
};

export default InstructorDashboard;