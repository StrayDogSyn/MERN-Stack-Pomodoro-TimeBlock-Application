import { create } from 'zustand';
import axios from 'axios';

export interface Task {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  estimatedPomodoros: number;
  completedPomodoros: number;
  category?: string;
  tags: string[];
  dueDate?: Date;
  completedAt?: Date;
  sessionIds: string[];
  timeSpent: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dueDate?: string;
}

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  loading: boolean; // Alias for compatibility
  error: string | null;
  filters: TaskFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Actions
  fetchTasks: (filters?: TaskFilters, page?: number) => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setCurrentTask: (task: Task | null) => void;
  setFilters: (filters: TaskFilters) => void;
  clearError: () => void;
  
  // Computed getters
  getTasksByStatus: (status: Task['status']) => Task[];
  getTasksByPriority: (priority: Task['priority']) => Task[];
  getOverdueTasks: () => Task[];
  getTodayTasks: () => Task[];
  getFilteredTasks: () => Task[];
  todayTasks: Task[];
  overdueTasks: Task[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  get loading() {
    return get().isLoading;
  },
  get todayTasks() {
    return get().getTodayTasks();
  },
  get overdueTasks() {
    return get().getOverdueTasks();
  },
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  },

  fetchTasks: async (filters = {}, page = 1) => {
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: get().pagination.limit.toString(),
        ...filters
      });

      const response = await axios.get(`${API_BASE_URL}/tasks?${params}`);
      const { tasks, pagination } = response.data.data;

      set({
        tasks,
        pagination,
        filters,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch tasks';
      set({
        isLoading: false,
        error: errorMessage
      });
    }
  },

  fetchTaskById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.get(`${API_BASE_URL}/tasks/${id}`);
      const { task } = response.data.data;

      set({
        currentTask: task,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch task';
      set({
        isLoading: false,
        error: errorMessage
      });
    }
  },

  createTask: async (taskData: Partial<Task>) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.post(`${API_BASE_URL}/tasks`, taskData);
      const { task } = response.data.data;

      set((state) => ({
        tasks: [task, ...state.tasks],
        isLoading: false,
        error: null
      }));

      return task;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create task';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.patch(`${API_BASE_URL}/tasks/${id}`, updates);
      const { task } = response.data.data;

      set((state) => ({
        tasks: state.tasks.map(t => t._id === id ? task : t),
        currentTask: state.currentTask?._id === id ? task : state.currentTask,
        isLoading: false,
        error: null
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update task';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  updateTaskStatus: async (id: string, status: Task['status']) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.patch(`${API_BASE_URL}/tasks/${id}/status`, { status });
      const { task } = response.data.data;

      set((state) => ({
        tasks: state.tasks.map(t => t._id === id ? task : t),
        currentTask: state.currentTask?._id === id ? task : state.currentTask,
        isLoading: false,
        error: null
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update task status';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  deleteTask: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await axios.delete(`${API_BASE_URL}/tasks/${id}`);

      set((state) => ({
        tasks: state.tasks.filter(t => t._id !== id),
        currentTask: state.currentTask?._id === id ? null : state.currentTask,
        isLoading: false,
        error: null
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete task';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  setCurrentTask: (task: Task | null) => {
    set({ currentTask: task });
  },

  setFilters: (filters: TaskFilters) => {
    set({ filters });
  },

  clearError: () => {
    set({ error: null });
  },

  // Computed getters
  getTasksByStatus: (status: Task['status']) => {
    return get().tasks.filter(task => task.status === status);
  },

  getTasksByPriority: (priority: Task['priority']) => {
    return get().tasks.filter(task => task.priority === priority);
  },

  getOverdueTasks: () => {
    const now = new Date();
    return get().tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'completed' && 
      task.status !== 'cancelled'
    );
  },

  getTodayTasks: () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    return get().tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) >= startOfDay && 
      new Date(task.dueDate) <= endOfDay
    );
  },

  getFilteredTasks: () => {
    const { tasks, filters } = get();
    let filteredTasks = [...tasks];

    if (filters.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }

    if (filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }

    if (filters.category) {
      filteredTasks = filteredTasks.filter(task => task.category === filters.category);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.dueDate) {
      const filterDate = new Date(filters.dueDate);
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === filterDate.toDateString();
      });
    }

    return filteredTasks;
  }
}));