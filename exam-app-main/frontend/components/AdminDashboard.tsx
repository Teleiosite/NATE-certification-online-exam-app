import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Exam, ExamAssignment, User, Role, EngineeringDepartment } from '../types';
import Modal from './Modal';

type AdminView = 'dashboard' | 'users' | 'exams';

// Reusable components
const AnalyticsCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-gray-800 p-6 rounded-lg flex items-center space-x-4">
        <div className="bg-gray-700 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

// Tab content components
const DashboardView: React.FC<{ users: User[], submissions: ExamAssignment[] }> = ({ users, submissions }) => {
    const stats = useMemo(() => ({
        totalUsers: users.length,
        students: users.filter(u => u.role === Role.Student).length,
        instructors: users.filter(u => u.role === Role.Instructor).length,
        submissions: submissions.length
    }), [users, submissions]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard title="Total Users" value={stats.totalUsers} icon={<UserIcon />} />
            <AnalyticsCard title="Students" value={stats.students} icon={<StudentIcon />} />
            <AnalyticsCard title="Instructors" value={stats.instructors} icon={<InstructorIcon />} />
            <AnalyticsCard title="Total Submissions" value={stats.submissions} icon={<SubmissionIcon />} />
        </div>
    );
};

const UserManagementView: React.FC<{ users: User[], onEditUser: (user: User) => void, onDeleteUser: (user: User) => void, onAddUser: () => void }> = ({ users, onEditUser, onDeleteUser, onAddUser }) => {
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-200">User Management</h2>
                <button onClick={onAddUser} className="px-4 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-500 text-white font-semibold transition">
                    + Add User
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Role</th>
                            <th scope="col" className="px-6 py-3">Department</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{user.firstName}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4 capitalize">{user.role}</td>
                                <td className="px-6 py-4">{user.department || 'N/A'}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => onEditUser(user)} className="font-medium text-sky-400 hover:underline">Edit</button>
                                    <button onClick={() => onDeleteUser(user)} className="font-medium text-red-400 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ExamManagementView: React.FC<{ exams: Exam[], submissions: ExamAssignment[], onViewExam: (exam: Exam) => void, onDeleteExam: (exam: Exam) => void }> = ({ exams, submissions, onViewExam, onDeleteExam }) => {
    return (
         <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-200 mb-4">Exam Management</h2>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">Exam Title</th>
                            <th scope="col" className="px-6 py-3">Department</th>
                            <th scope="col" className="px-6 py-3">Instructor</th>
                            <th scope="col" className="px-6 py-3">Questions</th>
                            <th scope="col" className="px-6 py-3">Submissions</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.map(exam => (
                            <tr key={exam.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{exam.title}</td>
                                <td className="px-6 py-4">{exam.department}</td>
                                <td className="px-6 py-4">{exam.instructorName}</td>
                                <td className="px-6 py-4">{exam.questions.length}</td>
                                <td className="px-6 py-4">{submissions.filter(s => s.examId === exam.id).length}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => onViewExam(exam)} className="font-medium text-sky-400 hover:underline">View</button>
                                    <button onClick={() => onDeleteExam(exam)} className="font-medium text-red-400 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         </div>
    );
}

const ExamDetailsView: React.FC<{ exam: Exam; onBack: () => void }> = ({ exam, onBack }) => {
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
                <div>
                    <h2 className="text-xl font-bold text-white">{exam.title}</h2>
                    <p className="text-sm text-gray-400">Exam Details (Instructor: {exam.instructorName})</p>
                </div>
                <button onClick={onBack} className="px-4 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-500 text-white font-semibold transition">
                    &larr; Back to Exams
                </button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="font-semibold text-lg mb-2 text-gray-200">Settings</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400">Department</p>
                            <p className="font-medium text-white">{exam.department}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Duration</p>
                            <p className="font-medium text-white">{exam.durationMinutes} minutes</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Retake Limit</p>
                            <p className="font-medium text-white">{exam.retakeLimit}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-200">Questions ({exam.questions.length})</h3>
                    <div className="space-y-3">
                        {exam.questions.map((q, index) => (
                            <div key={q.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                <p className="font-semibold text-white">{index + 1}. {q.text}</p>
                                <p className="text-xs text-gray-400 mt-1">{q.questionType.replace(/_/g, ' ')} - {q.points} points</p>
                                {q.options && (
                                    <div className="mt-2 space-y-1 text-sm pl-4">
                                        {q.options.map(opt => (
                                            <p key={opt.id} className={`${opt.isCorrect ? 'text-green-400' : 'text-gray-300'}`}>
                                                - {opt.text} {opt.isCorrect && '(Correct)'}
                                            </p>
                                        ))}
                                    </div>
                                )}
                                {q.correctAnswer && !q.options && (
                                    <div className="mt-2 text-sm pl-4">
                                         <p className="text-green-400">Correct Answer: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Icon components
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm6-11a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const StudentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const InstructorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SubmissionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

const UserEditModal: React.FC<{ user: User | null; onClose: () => void; onSave: (updatedUser: User) => void; }> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<User>>({});

    useEffect(() => {
        if (user) setFormData({ firstName: user.firstName, role: user.role, department: user.department });
    }, [user]);

    if (!user) return null;

    const handleSave = () => {
        onSave({ ...user, ...formData } as User);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-4">Edit User: {user.firstName}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Email (read-only)</label>
                        <input type="email" value={user.email} readOnly className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-gray-400 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">First Name</label>
                        <input type="text" value={formData.firstName || ''} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Role</label>
                        <select value={formData.role || ''} onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                            <option value={Role.Student}>Student</option>
                            <option value={Role.Instructor}>Instructor</option>
                            <option value={Role.Admin}>Admin</option>
                        </select>
                    </div>
                    {formData.role === Role.Student && (
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-300">Department</label>
                            <select value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value as EngineeringDepartment })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                                {Object.values(EngineeringDepartment).map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-semibold transition">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const UserAddModal: React.FC<{ onClose: () => void; onSave: (newUser: any) => Promise<void>; }> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({ firstName: '', email: '', password: '', role: Role.Student, department: EngineeringDepartment.Mechanical });
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!formData.firstName || !formData.email || !formData.password) {
            setError('All fields are required.');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        setError('');
        try {
            await onSave(formData);
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-4">Add New User</h2>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                     <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">First Name</label>
                        <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Email</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                     <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Password</label>
                        <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Role</label>
                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                            <option value={Role.Student}>Student</option>
                            <option value={Role.Instructor}>Instructor</option>
                            <option value={Role.Admin}>Admin</option>
                        </select>
                    </div>
                    {formData.role === Role.Student && (
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-300">Department</label>
                            <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value as EngineeringDepartment })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                                {Object.values(EngineeringDepartment).map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </form>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-semibold transition">Add User</button>
                </div>
            </div>
        </div>
    );
};


interface AdminDashboardProps {
    exams: Exam[];
    setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
    submissions: ExamAssignment[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ exams, setExams, submissions }) => {
    const { user, logout, getAllUsers, updateUser, deleteUser, addUser } = useAuth();
    const [view, setView] = useState<AdminView>('dashboard');
    const [viewingExam, setViewingExam] = useState<Exam | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    
    const refreshUsers = () => {
        setAllUsers(getAllUsers());
    };
    
    useEffect(() => {
        refreshUsers();
    }, []);

    const handleSaveUser = async (updatedUser: User) => {
        await updateUser(updatedUser.email, {
            firstName: updatedUser.firstName,
            role: updatedUser.role,
            department: updatedUser.department,
        });
        refreshUsers();
        setUserToEdit(null);
    };
    
    const handleConfirmDeleteUser = async () => {
        if (userToDelete) {
            await deleteUser(userToDelete.email);
            refreshUsers();
            setUserToDelete(null);
        }
    };
    
    const handleConfirmDeleteExam = () => {
        if (examToDelete) {
            setExams(prevExams => prevExams.filter(e => e.id !== examToDelete.id));
            setExamToDelete(null);
        }
    };

    const handleAddNewUser = async (newUser: any) => {
        await addUser(newUser.firstName, newUser.email, newUser.password, newUser.role, newUser.role === Role.Student ? newUser.department : undefined);
        refreshUsers();
        setIsAddUserModalOpen(false);
    };


    const renderContent = () => {
        switch (view) {
            case 'dashboard':
                return <DashboardView users={allUsers} submissions={submissions} />;
            case 'users':
                return <UserManagementView users={allUsers} onEditUser={setUserToEdit} onDeleteUser={setUserToDelete} onAddUser={() => setIsAddUserModalOpen(true)} />;
            case 'exams':
                return <ExamManagementView exams={exams} submissions={submissions} onViewExam={setViewingExam} onDeleteExam={setExamToDelete} />;
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col min-h-screen">
            <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white truncate">Admin Dashboard</h1>
                    <p className="text-sm text-gray-400 mt-1">Welcome, {user?.firstName} (Admin)</p>
                </div>
                <button onClick={logout} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition">Logout</button>
            </header>

            <div className="flex-shrink-0 border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => { setView('dashboard'); setViewingExam(null); }} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${view === 'dashboard' && !viewingExam ? 'border-sky-500 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>Dashboard</button>
                    <button onClick={() => { setView('users'); setViewingExam(null); }} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${view === 'users' && !viewingExam ? 'border-sky-500 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>User Management</button>
                    <button onClick={() => { setView('exams'); setViewingExam(null); }} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${view === 'exams' || viewingExam ? 'border-sky-500 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>Exam Management</button>
                </nav>
            </div>

            <main className="flex-grow flex flex-col min-h-0 overflow-y-auto">
                {viewingExam ? (
                    <ExamDetailsView exam={viewingExam} onBack={() => setViewingExam(null)} />
                ) : (
                    renderContent()
                )}
            </main>
            
            {userToEdit && (
                <UserEditModal 
                    user={userToEdit}
                    onClose={() => setUserToEdit(null)}
                    onSave={handleSaveUser}
                />
            )}
            
            {isAddUserModalOpen && (
                <UserAddModal
                    onClose={() => setIsAddUserModalOpen(false)}
                    onSave={handleAddNewUser}
                />
            )}
            
            <Modal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleConfirmDeleteUser}
                title="Confirm Deletion"
                confirmText="Yes, Delete User"
            >
                <p>Are you sure you want to delete the user <strong className="font-bold text-white">{userToDelete?.email}</strong>? This action cannot be undone.</p>
            </Modal>

            <Modal
                isOpen={!!examToDelete}
                onClose={() => setExamToDelete(null)}
                onConfirm={handleConfirmDeleteExam}
                title="Confirm Exam Deletion"
                confirmText="Yes, Delete Exam"
            >
                <p>Are you sure you want to delete the exam <strong className="font-bold text-white">{examToDelete?.title}</strong>? This will remove the exam and all associated submissions permanently.</p>
            </Modal>
        </div>
    );
};

export default AdminDashboard;