import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role, EngineeringDepartment } from '../types';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.Student);
  const [department, setDepartment] = useState<EngineeringDepartment>(EngineeringDepartment.Mechanical);
  const { register, error, isLoading } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(firstName, email, password, role, role === Role.Student ? department : undefined);
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center text-white">Create an Account</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
         <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">I am a...</label>
            <select
             value={role}
             onChange={(e) => setRole(e.target.value as Role)}
             className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
                <option value={Role.Student}>Student</option>
                <option value={Role.Instructor}>Instructor</option>
                <option value={Role.Admin}>Admin</option>
            </select>
        </div>

        {role === Role.Student && (
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Department</label>
                <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as EngineeringDepartment)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                    {Object.values(EngineeringDepartment).map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 text-lg font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed transition"
        >
          {isLoading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      <p className="text-sm text-center text-gray-400">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="font-medium text-sky-400 hover:underline">
          Login here
        </button>
      </p>
    </div>
  );
};

export default RegisterPage;