// User types
export interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Task types
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedPomodoros: number;
  completedPomodoros: number;
  dueDate?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Timer types
export enum SessionType {
  WORK = 'work',
  SHORT_BREAK = 'shortBreak',
  LONG_BREAK = 'longBreak'
}

export enum TimerStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

export interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
}

export interface Session {
  _id: string;
  type: SessionType;
  duration: number;
  completedAt: Date;
  taskId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// TimeBlock types
export enum TimeBlockStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface TimeBlock {
  _id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: TimeBlockStatus;
  color?: string;
  location?: string;
  userId: string;
  taskId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Store types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<void>;
  updateTask: (id: string, taskData: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setCurrentTask: (task: Task | null) => void;
}

export interface TimerState {
  currentSession: SessionType;
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  sessionCount: number;
  totalFocusTime: number;
  settings: TimerSettings;
  status: TimerStatus;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  skipTimer: () => void;
  resetTimer: () => void;
  updateSettings: (settings: Partial<TimerSettings>) => Promise<void>;
}

export interface TimeBlockState {
  timeBlocks: TimeBlock[];
  isLoading: boolean;
  fetchTimeBlocks: () => Promise<void>;
  createTimeBlock: (timeBlockData: Partial<TimeBlock>) => Promise<void>;
  updateTimeBlock: (id: string, timeBlockData: Partial<TimeBlock>) => Promise<void>;
  deleteTimeBlock: (id: string) => Promise<void>;
}

// Analytics types
export interface AnalyticsData {
  dailyPomodoros: { date: string; count: number }[];
  taskCompletion: { status: string; count: number }[];
  productivityTrends: { date: string; productivity: number }[];
  weeklyProgress: { week: string; completed: number; total: number }[];
}

export interface ProductivityStats {
  completionRate: number;
  totalFocusTime: number;
  averageDailyPomodoros: number;
  productivityScore: number;
}