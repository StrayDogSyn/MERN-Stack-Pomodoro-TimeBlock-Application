import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    const { token } = useAuthStore.getState();
    
    if (!token) {
      console.warn('No auth token available for socket connection');
      return;
    }

    // Disconnect existing connection
    if (this.socket) {
      this.socket.disconnect();
    }

    // Create new connection
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      // Auto-reconnect on certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        // Server initiated disconnect or client initiated - don't auto-reconnect
        return;
      }
      
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnect();
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
    });

    this.socket.on('authentication_error', (error) => {
      console.error('Socket authentication error:', error);
      // Force logout on auth error
      useAuthStore.getState().logout();
    });

    // Timer events
    this.socket.on('timer:started', (data) => {
      console.log('Timer started:', data);
      // Update timer store
    });

    this.socket.on('timer:paused', (data) => {
      console.log('Timer paused:', data);
      // Update timer store
    });

    this.socket.on('timer:resumed', (data) => {
      console.log('Timer resumed:', data);
      // Update timer store
    });

    this.socket.on('timer:completed', (data) => {
      console.log('Timer completed:', data);
      // Update timer store and show notification
    });

    this.socket.on('timer:skipped', (data) => {
      console.log('Timer skipped:', data);
      // Update timer store
    });

    // Session events
    this.socket.on('session:created', (data) => {
      console.log('Session created:', data);
      // Update session store
    });

    this.socket.on('session:updated', (data) => {
      console.log('Session updated:', data);
      // Update session store
    });

    // Task events
    this.socket.on('task:created', (data) => {
      console.log('Task created:', data);
      // Update task store
    });

    this.socket.on('task:updated', (data) => {
      console.log('Task updated:', data);
      // Update task store
    });

    this.socket.on('task:deleted', (data) => {
      console.log('Task deleted:', data);
      // Update task store
    });

    // Time block events
    this.socket.on('timeblock:created', (data) => {
      console.log('Time block created:', data);
      // Update time block store
    });

    this.socket.on('timeblock:updated', (data) => {
      console.log('Time block updated:', data);
      // Update time block store
    });

    this.socket.on('timeblock:deleted', (data) => {
      console.log('Time block deleted:', data);
      // Update time block store
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  // Timer events
  startTimer(sessionType: 'work' | 'shortBreak' | 'longBreak', taskId?: string) {
    this.socket?.emit('timer:start', { sessionType, taskId });
  }

  pauseTimer() {
    this.socket?.emit('timer:pause');
  }

  resumeTimer() {
    this.socket?.emit('timer:resume');
  }

  skipTimer() {
    this.socket?.emit('timer:skip');
  }

  completeTimer() {
    this.socket?.emit('timer:complete');
  }

  // Session events
  createSession(sessionData: any) {
    this.socket?.emit('session:create', sessionData);
  }

  updateSession(sessionId: string, updates: any) {
    this.socket?.emit('session:update', { sessionId, updates });
  }

  // Task events
  createTask(taskData: any) {
    this.socket?.emit('task:create', taskData);
  }

  updateTask(taskId: string, updates: any) {
    this.socket?.emit('task:update', { taskId, updates });
  }

  deleteTask(taskId: string) {
    this.socket?.emit('task:delete', { taskId });
  }

  // Time block events
  createTimeBlock(timeBlockData: any) {
    this.socket?.emit('timeblock:create', timeBlockData);
  }

  updateTimeBlock(timeBlockId: string, updates: any) {
    this.socket?.emit('timeblock:update', { timeBlockId, updates });
  }

  deleteTimeBlock(timeBlockId: string) {
    this.socket?.emit('timeblock:delete', { timeBlockId });
  }

  // Generic event listener
  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  // Generic event emitter
  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }

  // Remove event listener
  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  // Check connection status
  get isConnected() {
    return this.socket?.connected || false;
  }

  // Get socket ID
  get socketId() {
    return this.socket?.id;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;