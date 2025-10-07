import { create } from 'zustand';
import axios from 'axios';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export interface TimeBlock {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'work' | 'break' | 'meeting' | 'personal' | 'other';
  taskId?: string;
  sessionId?: string;
  color: string;
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
  };
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  reminders: number[]; // minutes before start time
  location?: string;
  attendees: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeBlockFilters {
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
}

interface TimeBlockState {
  timeBlocks: TimeBlock[];
  currentTimeBlock: TimeBlock | null;
  isLoading: boolean;
  error: string | null;
  filters: TimeBlockFilters;
  selectedDate: Date;
  viewMode: 'day' | 'week' | 'month';
  
  // Compatibility properties
  todayTimeBlocks: TimeBlock[];
  upcomingTimeBlocks: TimeBlock[];
  getTimeBlocksByWeek: (startDate: Date) => TimeBlock[];
  getCurrentTimeBlocks: () => TimeBlock[];
  loading: boolean;
  getTimeBlocksByDate: (date: Date) => TimeBlock[];

  // Actions
  fetchTimeBlocks: (filters?: TimeBlockFilters) => Promise<void>;
  fetchTimeBlockById: (id: string) => Promise<void>;
  fetchCalendarRange: (startDate: string, endDate: string) => Promise<void>;
  fetchTodaySchedule: () => Promise<void>;
  fetchTodayTimeBlocks: () => Promise<void>; // Compatibility alias
  createTimeBlock: (timeBlockData: Partial<TimeBlock>) => Promise<TimeBlock>;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => Promise<void>;
  updateTimeBlockStatus: (id: string, status: TimeBlock['status']) => Promise<void>;
  deleteTimeBlock: (id: string) => Promise<void>;
  setCurrentTimeBlock: (timeBlock: TimeBlock | null) => void;
  setFilters: (filters: TimeBlockFilters) => void;
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
  clearError: () => void;
  
  // Computed getters
  getTimeBlocksForDate: (date: Date) => TimeBlock[];
  getTimeBlocksForWeek: (startDate: Date) => TimeBlock[];
  getCurrentTimeBlock: () => TimeBlock | null;
  getUpcomingTimeBlocks: () => TimeBlock[];
  getConflictingTimeBlocks: (startTime: Date, endTime: Date, excludeId?: string) => TimeBlock[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD 
    ? 'https://trae5tthwuf3.vercel.app/api'
    : 'http://localhost:5000/api'
);

export const useTimeBlockStore = create<TimeBlockState>((set, get) => ({
  timeBlocks: [],
  currentTimeBlock: null,
  isLoading: false,
  error: null,
  filters: {},
  selectedDate: new Date(),
  viewMode: 'week',
  
  // Compatibility properties
  get todayTimeBlocks() {
    return get().getTimeBlocksForDate(new Date());
  },
  get upcomingTimeBlocks() {
    return get().getUpcomingTimeBlocks();
  },
  getTimeBlocksByWeek: (startDate: Date) => {
    return get().getTimeBlocksForWeek(startDate);
  },
  getCurrentTimeBlocks: () => {
    return get().getCurrentTimeBlock() ? [get().getCurrentTimeBlock()!] : [];
  },
  get loading() {
    return get().isLoading;
  },
  getTimeBlocksByDate: (date: Date) => {
    return get().getTimeBlocksForDate(date);
  },

  fetchTimeBlocks: async (filters = {}) => {
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams(filters as Record<string, string>);
      const response = await axios.get(`${API_BASE_URL}/timeblocks?${params}`);
      const { timeBlocks } = response.data.data;

      // Convert date strings to Date objects
      const processedTimeBlocks = timeBlocks.map((block: unknown) => {
        const timeBlock = block as TimeBlock;
        return {
          ...timeBlock,
          startTime: new Date(timeBlock.startTime),
          endTime: new Date(timeBlock.endTime),
          createdAt: new Date(timeBlock.createdAt),
          updatedAt: new Date(timeBlock.updatedAt)
        };
      });

      set({
        timeBlocks: processedTimeBlocks,
        filters,
        isLoading: false,
        error: null
      });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Failed to fetch time blocks';
      set({
        isLoading: false,
        error: errorMessage
      });
    }
  },

  fetchTimeBlockById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.get(`${API_BASE_URL}/timeblocks/${id}`);
      const { timeBlock } = response.data.data;

      const processedTimeBlock = {
        ...timeBlock,
        startTime: new Date(timeBlock.startTime),
        endTime: new Date(timeBlock.endTime),
        createdAt: new Date(timeBlock.createdAt),
        updatedAt: new Date(timeBlock.updatedAt)
      };

      set({
        currentTimeBlock: processedTimeBlock,
        isLoading: false,
        error: null
      });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Failed to fetch time block';
      set({
        isLoading: false,
        error: errorMessage
      });
    }
  },

  fetchCalendarRange: async (startDate: string, endDate: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.get(`${API_BASE_URL}/timeblocks/calendar/range`, {
        params: { startDate, endDate }
      });
      const { timeBlocks } = response.data.data;

      const processedTimeBlocks = timeBlocks.map((block: unknown) => {
        const timeBlock = block as TimeBlock;
        return {
          ...timeBlock,
          startTime: new Date(timeBlock.startTime),
          endTime: new Date(timeBlock.endTime),
          createdAt: new Date(timeBlock.createdAt),
          updatedAt: new Date(timeBlock.updatedAt)
        };
      });

      set({
        timeBlocks: processedTimeBlocks,
        isLoading: false,
        error: null
      });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Failed to fetch calendar range';
      set({
        isLoading: false,
        error: errorMessage
      });
    }
  },

  fetchTodaySchedule: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.get(`${API_BASE_URL}/timeblocks/today/schedule`);
      const { timeBlocks, currentBlock } = response.data.data;

      const processedTimeBlocks = timeBlocks.map((block: unknown) => {
        const timeBlock = block as TimeBlock;
        return {
          ...timeBlock,
          startTime: new Date(timeBlock.startTime),
          endTime: new Date(timeBlock.endTime),
          createdAt: new Date(timeBlock.createdAt),
          updatedAt: new Date(timeBlock.updatedAt)
        };
      });

      const processedCurrentBlock = currentBlock ? {
        ...currentBlock,
        startTime: new Date(currentBlock.startTime),
        endTime: new Date(currentBlock.endTime),
        createdAt: new Date(currentBlock.createdAt),
        updatedAt: new Date(currentBlock.updatedAt)
      } : null;

      set({
        timeBlocks: processedTimeBlocks,
        currentTimeBlock: processedCurrentBlock,
        isLoading: false,
        error: null
      });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Failed to fetch today\'s schedule';
      set({
        isLoading: false,
        error: errorMessage
      });
    }
  },

  fetchTodayTimeBlocks: async () => {
    return get().fetchTodaySchedule();
  },

  createTimeBlock: async (timeBlockData: Partial<TimeBlock>) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.post(`${API_BASE_URL}/timeblocks`, timeBlockData);
      const { timeBlock } = response.data.data;

      const processedTimeBlock = {
        ...timeBlock,
        startTime: new Date(timeBlock.startTime),
        endTime: new Date(timeBlock.endTime),
        createdAt: new Date(timeBlock.createdAt),
        updatedAt: new Date(timeBlock.updatedAt)
      };

      set((state) => ({
        timeBlocks: [...state.timeBlocks, processedTimeBlock],
        isLoading: false,
        error: null
      }));

      return processedTimeBlock;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Failed to create time block';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  updateTimeBlock: async (id: string, updates: Partial<TimeBlock>) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.patch(`${API_BASE_URL}/timeblocks/${id}`, updates);
      const { timeBlock } = response.data.data;

      const processedTimeBlock = {
        ...timeBlock,
        startTime: new Date(timeBlock.startTime),
        endTime: new Date(timeBlock.endTime),
        createdAt: new Date(timeBlock.createdAt),
        updatedAt: new Date(timeBlock.updatedAt)
      };

      set((state) => ({
        timeBlocks: state.timeBlocks.map(tb => tb._id === id ? processedTimeBlock : tb),
        currentTimeBlock: state.currentTimeBlock?._id === id ? processedTimeBlock : state.currentTimeBlock,
        isLoading: false,
        error: null
      }));
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Failed to update time block';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  updateTimeBlockStatus: async (id: string, status: TimeBlock['status']) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.patch(`${API_BASE_URL}/timeblocks/${id}/status`, { status });
      const { timeBlock } = response.data.data;

      const processedTimeBlock = {
        ...timeBlock,
        startTime: new Date(timeBlock.startTime),
        endTime: new Date(timeBlock.endTime),
        createdAt: new Date(timeBlock.createdAt),
        updatedAt: new Date(timeBlock.updatedAt)
      };

      set((state) => ({
        timeBlocks: state.timeBlocks.map(tb => tb._id === id ? processedTimeBlock : tb),
        currentTimeBlock: state.currentTimeBlock?._id === id ? processedTimeBlock : state.currentTimeBlock,
        isLoading: false,
        error: null
      }));
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Failed to update time block status';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  deleteTimeBlock: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await axios.delete(`${API_BASE_URL}/timeblocks/${id}`);

      set((state) => ({
        timeBlocks: state.timeBlocks.filter(tb => tb._id !== id),
        currentTimeBlock: state.currentTimeBlock?._id === id ? null : state.currentTimeBlock,
        isLoading: false,
        error: null
      }));
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Failed to delete time block';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  },

  setCurrentTimeBlock: (timeBlock: TimeBlock | null) => {
    set({ currentTimeBlock: timeBlock });
  },

  setFilters: (filters: TimeBlockFilters) => {
    set({ filters });
  },

  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
  },

  setViewMode: (mode: 'day' | 'week' | 'month') => {
    set({ viewMode: mode });
  },

  clearError: () => {
    set({ error: null });
  },

  // Computed getters
  getTimeBlocksForDate: (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return get().timeBlocks.filter(block =>
      block.startTime >= startOfDay && block.startTime <= endOfDay
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  },

  getTimeBlocksForWeek: (startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    return get().timeBlocks.filter(block =>
      block.startTime >= startDate && block.startTime <= endDate
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  },

  getCurrentTimeBlock: () => {
    const now = new Date();
    return get().timeBlocks.find(block =>
      block.startTime <= now && 
      block.endTime > now && 
      block.status === 'in-progress'
    ) || null;
  },

  getUpcomingTimeBlocks: () => {
    const now = new Date();
    return get().timeBlocks
      .filter(block => block.startTime > now && block.status === 'scheduled')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 5);
  },

  getConflictingTimeBlocks: (startTime: Date, endTime: Date, excludeId?: string) => {
    return get().timeBlocks.filter(block =>
      block._id !== excludeId &&
      block.status !== 'cancelled' &&
      ((block.startTime < endTime && block.endTime > startTime))
    );
  }
}));