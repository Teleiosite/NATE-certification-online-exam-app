import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import InstructorDashboard from './components/InstructorDashboard';
import StudentDashboard from './components/StudentDashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AdminDashboard from './components/AdminDashboard';
import { Role, Exam, QuestionType, ExamAssignment, SubmissionStatus, EngineeringDepartment } from './types';

const mockExams: Exam[] = [
  {
    id: 'exam-1',
    title: 'Thermodynamics & Fluid Mechanics',
    durationMinutes: 60,
    retakeLimit: 1,
    instructorId: 'user-2',
    instructorName: 'Dr. Smith',
    department: EngineeringDepartment.Mechanical,
    questions: [
      { id: 'q1', text: 'What is the first law of thermodynamics?', questionType: QuestionType.Essay, points: 15, explanation: 'The first law, also known as Law of Conservation of Energy, states that energy cannot be created or destroyed in an isolated system.', orderIndex: 0 },
      { id: 'q2', text: 'Which of the following are types of fluid flow?', questionType: QuestionType.MultipleSelect, options: [ {id: 'q2o1', text: 'Laminar', isCorrect: true}, {id: 'q2o2', text: 'Turbulent', isCorrect: true}, {id: 'q2o3', text: 'Transitional', isCorrect: true}, {id: 'q2o4', text: 'Static'}], points: 10, correctAnswer: ['q2o1', 'q2o2', 'q2o3'], orderIndex: 1 },
      { id: 'q3', text: 'Bernoulli\'s principle describes the behavior of a fluid under varying conditions of...', questionType: QuestionType.ShortAnswer, points: 10, correctAnswer: 'flow, pressure, and height', orderIndex: 2 },
    ],
  },
  {
    id: 'exam-2',
    title: 'Circuit Theory and Analysis',
    durationMinutes: 45,
    retakeLimit: 2,
    instructorId: 'user-2',
    instructorName: 'Dr. Smith',
    department: EngineeringDepartment.Electrical,
    questions: [
      { id: 'q2-1', text: 'What is Ohm\'s Law?', questionType: QuestionType.Essay, points: 10, orderIndex: 0 },
      { id: 'q2-2', text: 'Which component is used to store electrical charge?', questionType: QuestionType.MultipleChoice, options: [{id: 'q2-2o1', text: 'Resistor'}, {id: 'q2-2o2', text: 'Inductor'}, {id: 'q2-2o3', text: 'Capacitor', isCorrect: true}], correctAnswer: 'q2-2o3', points: 5, orderIndex: 1 },
    ]
  },
  {
    id: 'exam-3',
    title: 'Structural Analysis Fundamentals',
    durationMinutes: 30,
    retakeLimit: 0,
    instructorId: 'user-3',
    instructorName: 'Prof. Davis',
    department: EngineeringDepartment.Civil,
    questions: [
      { id: 'q3-1', text: 'What is the primary purpose of a truss structure?', questionType: QuestionType.ShortAnswer, points: 10, orderIndex: 0 },
      { id: 'q3-2', text: 'Explain the concept of "Factor of Safety" in structural engineering.', questionType: QuestionType.Essay, points: 15, orderIndex: 1 },
    ]
  }
];


const mockSubmissions: ExamAssignment[] = [
    {
        id: 'sub-1',
        student: {id: 'stud-1', email: 'jessica@test.com', firstName: 'Jessica', role: Role.Student },
        examId: 'exam-1',
        status: SubmissionStatus.Submitted,
        responses: { 'q1': 'It is for side effects.', 'q2': ['q2o1', 'q2o3'], 'q3': 'it batches updates' },
        score: null, submittedAt: new Date(Date.now() - 3600000), suspiciousActivityCount: 2, retakeCount: 0,
    },
    {
        id: 'sub-2',
        student: {id: 'stud-2', email: 'mark@test.com', firstName: 'Mark', role: Role.Student },
        examId: 'exam-1',
        status: SubmissionStatus.Graded,
        responses: { 'q1': 'For handling side effects like API calls.', 'q2': ['q2o1', 'q2o2', 'q2o3'], 'q3': 'it is a lightweight copy' },
        score: 25, submittedAt: new Date(Date.now() - 7200000), suspiciousActivityCount: 0, retakeCount: 0,
    },
];


const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [exams, setExams] = useState<Exam[]>(mockExams);
  const [submissions, setSubmissions] = useState<ExamAssignment[]>(mockSubmissions);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-xl">Loading Session...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        {isLoginView ? (
          <LoginPage onSwitchToRegister={() => setIsLoginView(false)} />
        ) : (
          <RegisterPage onSwitchToLogin={() => setIsLoginView(true)} />
        )}
      </div>
    );
  }

  const renderDashboard = () => {
    if (!user) return null;
    switch (user.role) {
      case Role.Student:
        return <StudentDashboard exams={exams} />;
      case Role.Instructor:
        return <InstructorDashboard 
                  allExams={exams} 
                  setAllExams={setExams}
                  allSubmissions={submissions}
                  setSubmissions={setSubmissions}
                />;
      case Role.Admin:
        return <AdminDashboard exams={exams} setExams={setExams} submissions={submissions} />;
      default:
        return <div className="flex items-center justify-center h-screen">Error: Unknown user role.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 relative">
      {renderDashboard()}
    </div>
  );
};

export default App;