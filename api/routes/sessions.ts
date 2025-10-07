import express, { Request, Response } from 'express';
import { Session } from '../models/Session.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { validateSession } from '../middleware/validation.js';

const router = express.Router();

// Get all sessions for authenticated user
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status, 
      startDate, 
      endDate,
      taskId 
    } = req.query;

    const query: any = { userId };

    // Add filters
    if (type) query.type = type;
    if (status) query.status = status;
    if (taskId) query.taskId = taskId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const sessions = await Session.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit))
      .populate('taskId', 'title category priority');

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sessions'
    });
  }
});

// Get session by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const sessionId = req.params.id;

    const session = await Session.findOne({ _id: sessionId, userId })
      .populate('taskId', 'title category priority');

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { session }
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching session'
    });
  }
});

// Create new session
router.post('/', authenticate, validateSession, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { type, duration, taskId, notes, tags, sessionNumber, cycleId } = req.body;

    const session = new Session({
      userId,
      type,
      duration,
      taskId,
      notes,
      tags: tags || [],
      sessionNumber: sessionNumber || 1,
      cycleId,
      status: 'planned'
    });

    await session.save();

    // Populate task information
    await session.populate('taskId', 'title category priority');

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating session'
    });
  }
});

// Start session
router.patch('/:id/start', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const sessionId = req.params.id;

    const session = await Session.findOne({ _id: sessionId, userId });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found'
      });
      return;
    }

    if (session.status !== 'planned' && session.status !== 'paused') {
      res.status(400).json({
        success: false,
        message: 'Session cannot be started in current state'
      });
      return;
    }

    session.status = 'active';
    session.startTime = new Date();
    
    if (session.status === 'paused' && session.pausedAt) {
      // Add paused time to total paused duration
      const pausedTime = (new Date().getTime() - session.pausedAt.getTime()) / (1000 * 60);
      session.pausedDuration += pausedTime;
      session.pausedAt = undefined;
    }

    await session.save();

    res.json({
      success: true,
      message: 'Session started successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting session'
    });
  }
});

// Pause session
router.patch('/:id/pause', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const sessionId = req.params.id;

    const session = await Session.findOne({ _id: sessionId, userId });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found'
      });
      return;
    }

    if (session.status !== 'active') {
      res.status(400).json({
        success: false,
        message: 'Only active sessions can be paused'
      });
      return;
    }

    session.status = 'paused';
    session.pausedAt = new Date();

    await session.save();

    res.json({
      success: true,
      message: 'Session paused successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Pause session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while pausing session'
    });
  }
});

// Complete session
router.patch('/:id/complete', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const sessionId = req.params.id;
    const { actualDuration, notes } = req.body;

    const session = await Session.findOne({ _id: sessionId, userId });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found'
      });
      return;
    }

    if (session.status === 'completed') {
      res.status(400).json({
        success: false,
        message: 'Session is already completed'
      });
      return;
    }

    session.status = 'completed';
    session.endTime = new Date();
    session.actualDuration = actualDuration || session.duration;
    if (notes) session.notes = notes;

    await session.save();

    // Update user stats and task progress
    const user = await User.findById(userId);
    if (user && session.type === 'work') {
      user.stats.totalSessions += 1;
      user.stats.totalFocusTime += session.actualDuration || session.duration;
      user.stats.lastSessionDate = new Date();
      
      // Update streak
      const today = new Date();
      const lastSession = user.stats.lastSessionDate;
      if (lastSession) {
        const daysDiff = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          user.stats.streakDays += 1;
          if (user.stats.streakDays > user.stats.longestStreak) {
            user.stats.longestStreak = user.stats.streakDays;
          }
        } else if (daysDiff > 1) {
          user.stats.streakDays = 1;
        }
      } else {
        user.stats.streakDays = 1;
      }

      await user.save();
    }

    // Update task progress if associated with a task
    if (session.taskId && session.type === 'work') {
      const task = await Task.findById(session.taskId);
      if (task) {
        task.completedPomodoros += 1;
        task.timeSpent += session.actualDuration || session.duration;
        task.sessionIds.push(session._id);
        
        if (task.completedPomodoros >= task.estimatedPomodoros && task.status !== 'completed') {
          task.status = 'completed';
        } else if (task.status === 'todo') {
          task.status = 'in-progress';
        }

        await task.save();
      }
    }

    res.json({
      success: true,
      message: 'Session completed successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing session'
    });
  }
});

// Cancel session
router.patch('/:id/cancel', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const sessionId = req.params.id;

    const session = await Session.findOne({ _id: sessionId, userId });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found'
      });
      return;
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Session cannot be cancelled in current state'
      });
      return;
    }

    session.status = 'cancelled';
    session.endTime = new Date();

    await session.save();

    res.json({
      success: true,
      message: 'Session cancelled successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling session'
    });
  }
});

// Update session
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const sessionId = req.params.id;
    const { notes, tags } = req.body;

    const session = await Session.findOne({ _id: sessionId, userId });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found'
      });
      return;
    }

    if (notes !== undefined) session.notes = notes;
    if (tags !== undefined) session.tags = tags;

    await session.save();

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating session'
    });
  }
});

// Delete session
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const sessionId = req.params.id;

    const session = await Session.findOneAndDelete({ _id: sessionId, userId });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting session'
    });
  }
});

export default router;