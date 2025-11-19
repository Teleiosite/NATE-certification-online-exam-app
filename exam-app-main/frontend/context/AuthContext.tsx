import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, Role, AuthContextType, EngineeringDepartment } from '../types';

// --- Mock Database ---
// In a real app, this would be an API call.
// We'll use localStorage to simulate a persistent user database.
const USERS_DB_KEY = 'nate_exam_users';
const SESSION_KEY = 'nate_exam_session';

const getMockUsers = (): Record<string, any> => {
  const users = localStorage.getItem(USERS_DB_KEY);
  if (users) {
    return JSON.parse(users);
  }
  // Pre-populate with default users if DB is empty
  const defaultUsers = {
    'student@nate-exam.com': { id: 'user-1', email: 'student@nate-exam.com', password: 'password123', firstName: 'Alex', role: Role.Student, department: EngineeringDepartment.Mechanical },
    'instructor@nate-exam.com': { id: 'user-2', email: 'instructor@nate-exam.com', password: 'password123', firstName: 'Dr. Smith', role: Role.Instructor },
    'instructor2@nate-exam.com': { id: 'user-3', email: 'instructor2@nate-exam.com', password: 'password123', firstName: 'Prof. Davis', role: Role.Instructor },
    'admin@nate-exam.com': { id: 'user-admin', email: 'admin@nate-exam.com', password: 'password123', firstName: 'Admin', role: Role.Admin },
  };
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
};

const saveMockUsers = (users: Record<string, any>) => {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

// --- Auth Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for an active session on component mount
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        setUser(JSON.parse(session));
      }
    } catch (e) {
      console.error("Failed to parse session data", e);
      localStorage.removeItem(SESSION_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    const users = getMockUsers();
    const existingUser = users[email];

    if (existingUser) {
        if (existingUser.password === password) {
            const { password: _, ...userToStore } = existingUser;
            setUser(userToStore);
            localStorage.setItem(SESSION_KEY, JSON.stringify(userToStore));
        } else {
            setError("Incorrect password. Please try again.");
        }
    } else {
        setError("No account found with that email address.");
    }
    setIsLoading(false);
  };

  const register = async (firstName: string, email: string, password: string, role: Role, department?: EngineeringDepartment): Promise<void> => {
    setIsLoading(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    const users = getMockUsers();
    if (users[email]) {
      setError("An account with this email already exists.");
      setIsLoading(false);
      return;
    }

    const newUser: any = { id: `user-${Date.now()}`, firstName, email, password, role };
    if (role === Role.Student && department) {
        newUser.department = department;
    }
    users[email] = newUser;
    saveMockUsers(users);

    const { password: _, ...userToStore } = newUser;
    setUser(userToStore);
    localStorage.setItem(SESSION_KEY, JSON.stringify(userToStore));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };
  
  const getAllUsers = (): User[] => {
      const users = getMockUsers();
      return Object.values(users).map(u => {
          const { password, ...userToReturn } = u;
          return userToReturn as User;
      });
  };

  const updateUser = async (email: string, updates: Partial<Omit<User, 'id' | 'email'>>): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    const users = getMockUsers();
    if (users[email]) {
      users[email] = { ...users[email], ...updates };
      saveMockUsers(users);
    } else {
      throw new Error("User not found");
    }
  };

  const deleteUser = async (email: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    const users = getMockUsers();
    if (users[email]) {
      delete users[email];
      saveMockUsers(users);
    } else {
      throw new Error("User not found");
    }
  };
  
  const addUser = async (firstName: string, email: string, password: string, role: Role, department?: EngineeringDepartment): Promise<void> => {
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    
    const users = getMockUsers();
    if (users[email]) {
      const err = "An account with this email already exists.";
      setError(err);
      throw new Error(err);
    }

    const newUser: any = { id: `user-${Date.now()}`, firstName, email, password, role };
    if (role === Role.Student && department) {
        newUser.department = department;
    }
    users[email] = newUser;
    saveMockUsers(users);
  };


  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    getAllUsers,
    updateUser,
    deleteUser,
    addUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};