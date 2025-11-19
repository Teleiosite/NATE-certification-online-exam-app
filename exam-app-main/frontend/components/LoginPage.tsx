import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, isLoading } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center text-white">Welcome to NATE CERTIFICATION EXAM PLATFORM</h1>
      <p className="text-center text-gray-400 text-xs">
        Login with: <code className="bg-gray-700 p-1 rounded">student@nate-exam.com</code>, <code className="bg-gray-700 p-1 rounded">instructor@nate-exam.com</code>, <code className="bg-gray-700 p-1 rounded">instructor2@nate-exam.com</code> or <code className="bg-gray-700 p-1 rounded">admin@nate-exam.com</code> (pw: <code className="bg-gray-700 p-1 rounded">password123</code>)
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
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
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 text-lg font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed transition"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-sm text-center text-gray-400">
        Don't have an account?{' '}
        <button onClick={onSwitchToRegister} className="font-medium text-sky-400 hover:underline">
          Register here
        </button>
      </p>
    </div>
  );
};

export default LoginPage;