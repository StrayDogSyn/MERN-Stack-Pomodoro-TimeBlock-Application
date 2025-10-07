import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDatabase } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import taskRoutes from './routes/tasks.js';
import timeBlockRoutes from './routes/timeblocks.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Connect to database
connectDatabase();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'StrayDog Pomodoro API is running!',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/timeblocks', timeBlockRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user room for personalized updates
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Handle timer events
  socket.on('timer-start', (data) => {
    socket.to(`user-${data.userId}`).emit('timer-started', data);
  });

  socket.on('timer-pause', (data) => {
    socket.to(`user-${data.userId}`).emit('timer-paused', data);
  });

  socket.on('timer-complete', (data) => {
    socket.to(`user-${data.userId}`).emit('timer-completed', data);
  });

  socket.on('timer-reset', (data) => {
    socket.to(`user-${data.userId}`).emit('timer-reset', data);
  });

  // Handle session updates
  socket.on('session-update', (data) => {
    socket.to(`user-${data.userId}`).emit('session-updated', data);
  });

  // Handle task updates
  socket.on('task-update', (data) => {
    socket.to(`user-${data.userId}`).emit('task-updated', data);
  });

  // Handle time block updates
  socket.on('timeblock-update', (data) => {
    socket.to(`user-${data.userId}`).emit('timeblock-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

export default app;
export { app, server, io };
