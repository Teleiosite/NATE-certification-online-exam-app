export enum QuestionType {
  MultipleChoice = 'multiple_choice',
  MultipleSelect = 'multiple_select',
  TrueFalse = 'true_false',
  ShortAnswer = 'short_answer',
  Essay = 'essay',
}

export enum Role {
  Student = 'student',
  Instructor = 'instructor',
  Admin = 'admin',
}

export enum EngineeringDepartment {
  Aeronautical = "Aeronautical Engineering",
  Agricultural = "Agricultural Engineering",
  AIAndRobotics = "Artificial Intelligence and Robotics Engineering",
  Biomedical = "Biomedical Engineering",
  Chemical = "Chemical Engineering",
  Civil = "Civil Engineering",
  ComputerScience = "Computer Science Engineering",
  Electrical = "Electrical Engineering",
  ElectronicsAndCommunication = "Electronics and Communication Engineering",
  Mechanical = "Mechanical Engineering",
  Metallurgical = "Metallurgical Engineering",
  Mining = "Mining Engineering",
  Petroleum = "Petroleum Engineering",
  Production = "Production Engineering",
  Robotics = "Robotics Engineering",
  Structural = "Structural Engineering",
  Telecommunication = "Telecommunication Engineering",
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  role: Role;
  department?: EngineeringDepartment;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password:string) => Promise<void>;
  register: (firstName: string, email: string, password: string, role: Role, department?: EngineeringDepartment) => Promise<void>;
  logout: () => void;
  getAllUsers: () => User[];
  updateUser: (email: string, updates: Partial<Omit<User, 'id' | 'email'>>) => Promise<void>;
  deleteUser: (email: string) => Promise<void>;
  addUser: (firstName: string, email: string, password: string, role: Role, department?: EngineeringDepartment) => Promise<void>;
}


export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  text: string;
  questionType: QuestionType;
  options?: QuestionOption[];
  points: number;
  imageUrl?: string;
  // For auto-gradable questions
  correctAnswer?: Answer; 
  explanation?: string;
  orderIndex: number;
  department?: EngineeringDepartment;
}

export interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  questions: Question[];
  retakeLimit: number;
  instructorId: string;
  instructorName: string;
  department: EngineeringDepartment;
}

export type Answer = string | string[];

export interface Responses {
  [questionId: string]: Answer;
}

export interface StudentResponse {
    question: Question;
    answer: Answer;
    isCorrect: boolean | null; // null for manually graded questions
    score: number;
    feedback?: string;
}

export enum SubmissionStatus {
    InProgress = 'in_progress',
    Submitted = 'submitted',
    Graded = 'graded'
}

export interface ExamAssignment {
    id:string;
    student: User;
    examId: string;
    status: SubmissionStatus;
    responses: Responses;
    score: number | null;
    submittedAt: Date;
    suspiciousActivityCount: number;
    retakeCount: number;
}

export interface StudentSubmission {
    responses: Responses;
    timeTaken: number;
    retakeCount: number;
    score: number;
    maxScore: number;
    submissionDate: string;
}

export type QuestionBank = Question[];