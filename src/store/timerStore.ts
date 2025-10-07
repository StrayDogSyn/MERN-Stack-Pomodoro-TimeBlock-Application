import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SessionType = 'work' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerSession {
  id: string;
  type: SessionType;
  duration: number; // in seconds
  remainingTime: number;
  status: TimerStatus;
  startTime?: Date;
  endTime?: Date;
  pausedDuration: number;
  taskId?: string;
  cycleId: string;
  sessionNumber: number;
}

interface TimerState {
  currentSession: TimerSession | null;
  cycleId: string;
  sessionNumber: number;
  completedSessions: TimerSession[];
  isAutoStartEnabled: boolean;
  soundEnabled: boolean;
  
  // Timer settings
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  
  // Computed properties for compatibility
  isRunning: boolean;
  isPaused: boolean;
  timeLeft: number;
  settings: {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
  };
  sessionCount: number;
  
  // Actions
  startSession: (type: SessionType, taskId?: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: () => void;
  skipSession: () => void;
  resetTimer: () => void;
  tick: () => void;
  updateSettings: (settings: {
    workDuration?: number;
    shortBreakDuration?: number;
    longBreakDuration?: number;
    longBreakInterval?: number;
    isAutoStartEnabled?: boolean;
    soundEnabled?: boolean;
  }) => void;
  getNextSessionType: () => SessionType;
  generateCycleId: () => string;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      cycleId: '',
      sessionNumber: 0,
      completedSessions: [],
      isAutoStartEnabled: false,
      soundEnabled: true,
      
      // Default Pomodoro settings (in minutes)
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      
      // Computed properties
      get isRunning() {
        return get().currentSession?.status === 'running';
      },
      get isPaused() {
        return get().currentSession?.status === 'paused';
      },
      get timeLeft() {
        return get().currentSession?.remainingTime || 0;
      },
      get settings() {
        const state = get();
        return {
          workDuration: state.workDuration,
          shortBreakDuration: state.shortBreakDuration,
          longBreakDuration: state.longBreakDuration,
        };
      },
      get sessionCount() {
        return get().sessionNumber;
      },

      startSession: (type: SessionType, taskId?: string) => {
        const state = get();
        const durationMap = {
          'work': state.workDuration,
          'shortBreak': state.shortBreakDuration,
          'longBreak': state.longBreakDuration
        };
        
        const duration = durationMap[type] * 60; // Convert to seconds
        const newSessionNumber = type === 'work' ? state.sessionNumber + 1 : state.sessionNumber;
        const cycleId = state.cycleId || state.generateCycleId();
        
        const session: TimerSession = {
          id: `${cycleId}-${newSessionNumber}-${type}`,
          type,
          duration,
          remainingTime: duration,
          status: 'running',
          startTime: new Date(),
          pausedDuration: 0,
          taskId,
          cycleId,
          sessionNumber: newSessionNumber
        };

        set({
          currentSession: session,
          sessionNumber: newSessionNumber,
          cycleId
        });
      },

      pauseSession: () => {
        const { currentSession } = get();
        if (currentSession && currentSession.status === 'running') {
          set({
            currentSession: {
              ...currentSession,
              status: 'paused'
            }
          });
        }
      },

      resumeSession: () => {
        const { currentSession } = get();
        if (currentSession && currentSession.status === 'paused') {
          set({
            currentSession: {
              ...currentSession,
              status: 'running'
            }
          });
        }
      },

      completeSession: () => {
        const { currentSession, completedSessions } = get();
        if (currentSession) {
          const completedSession: TimerSession = {
            ...currentSession,
            status: 'completed',
            endTime: new Date(),
            remainingTime: 0
          };

          set({
            currentSession: null,
            completedSessions: [...completedSessions, completedSession]
          });

          // Auto-start next session if enabled
          if (get().isAutoStartEnabled) {
            const nextType = get().getNextSessionType();
            setTimeout(() => {
              get().startSession(nextType, currentSession.taskId);
            }, 1000);
          }
        }
      },

      skipSession: () => {
        const { currentSession, completedSessions } = get();
        if (currentSession) {
          const skippedSession: TimerSession = {
            ...currentSession,
            status: 'completed',
            endTime: new Date(),
            remainingTime: 0
          };

          set({
            currentSession: null,
            completedSessions: [...completedSessions, skippedSession]
          });
        }
      },

      resetTimer: () => {
        set({
          currentSession: null,
          cycleId: '',
          sessionNumber: 0
        });
      },

      tick: () => {
        const { currentSession } = get();
        if (currentSession && currentSession.status === 'running') {
          const newRemainingTime = Math.max(0, currentSession.remainingTime - 1);
          
          if (newRemainingTime === 0) {
            get().completeSession();
          } else {
            set({
              currentSession: {
                ...currentSession,
                remainingTime: newRemainingTime
              }
            });
          }
        }
      },

      updateSettings: (settings) => {
        set((state) => ({
          ...state,
          ...settings
        }));
      },

      getNextSessionType: (): SessionType => {
        const { sessionNumber, longBreakInterval } = get();
        
        if (sessionNumber === 0) {
          return 'work';
        }
        
        const completedWorkSessions = Math.floor(sessionNumber);
        
        // If we just completed a work session
        if (completedWorkSessions % longBreakInterval === 0) {
          return 'longBreak';
        } else {
          return 'shortBreak';
        }
      },

      generateCycleId: () => {
        return `cycle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    }),
    {
      name: 'timer-storage',
      partialize: (state) => ({
        workDuration: state.workDuration,
        shortBreakDuration: state.shortBreakDuration,
        longBreakDuration: state.longBreakDuration,
        longBreakInterval: state.longBreakInterval,
        isAutoStartEnabled: state.isAutoStartEnabled,
        soundEnabled: state.soundEnabled,
        completedSessions: state.completedSessions.slice(-50) // Keep only last 50 sessions
      })
    }
  )
);