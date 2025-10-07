import express, { Request, Response } from 'express';
import { Task } from '../models/Task.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { validateTask } from '../middleware/validation.js';

const router = express.Router();

// Get all tasks for authenticated user
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { 
      page = 1, 
      limit = 20, 
      status, 
      priority, 
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = { userId };

    // Add filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const tasks = await Task.find(query)
      .sort(sortOptions)
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks'
    });
  }
});

// Get task by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const taskId = req.params.id;

    const task = await Task.findOne({ _id: taskId, userId })
      .populate('sessionIds', 'type duration status startTime endTime');

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task'
    });
  }
});

// Create new task
router.post('/', authenticate, validateTask, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { 
      title, 
      description, 
      priority, 
      estimatedPomodoros, 
      category, 
      tags, 
      dueDate 
    } = req.body;

    const task = new Task({
      userId,
      title,
      description,
      priority: priority || 'medium',
      estimatedPomodoros,
      category,
      tags: tags || [],
      dueDate: dueDate ? new Date(dueDate) : undefined
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating task'
    });
  }
});

// Update task
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const taskId = req.params.id;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.userId;
    delete updates.completedPomodoros;
    delete updates.sessionIds;
    delete updates.timeSpent;
    delete updates.completedAt;

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task'
    });
  }
});

// Update task status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const taskId = req.params.id;
    const { status } = req.body;

    if (!['todo', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
      return;
    }

    const task = await Task.findOne({ _id: taskId, userId });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    task.status = status;
    
    if (status === 'completed' && !task.completedAt) {
      task.completedAt = new Date();
    } else if (status !== 'completed') {
      task.completedAt = undefined;
    }

    await task.save();

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task status'
    });
  }
});

// Delete task
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const taskId = req.params.id;

    const task = await Task.findOneAndDelete({ _id: taskId, userId });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting task'
    });
  }
});

// Get task statistics
router.get('/:id/stats', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const taskId = req.params.id;

    const task = await Task.findOne({ _id: taskId, userId })
      .populate('sessionIds', 'type duration actualDuration status startTime endTime');

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    const sessions = task.sessionIds as any[];
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const workSessions = completedSessions.filter(s => s.type === 'work');

    const stats = {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      workSessions: workSessions.length,
      totalTimeSpent: task.timeSpent,
      averageSessionDuration: workSessions.length > 0 
        ? Math.round(workSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0) / workSessions.length)
        : 0,
      completionPercentage: Math.min(100, Math.round((task.completedPomodoros / task.estimatedPomodoros) * 100)),
      estimatedTimeRemaining: Math.max(0, (task.estimatedPomodoros - task.completedPomodoros) * 25), // Assuming 25min pomodoros
      isOverdue: task.dueDate ? new Date() > task.dueDate && task.status !== 'completed' : false
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task statistics'
    });
  }
});

// Get tasks summary
router.get('/summary/overview', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const [
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      todayTasks
    ] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, status: 'todo' }),
      Task.countDocuments({ userId, status: 'in-progress' }),
      Task.countDocuments({ userId, status: 'completed' }),
      Task.countDocuments({ 
        userId, 
        dueDate: { $lt: new Date() }, 
        status: { $nin: ['completed', 'cancelled'] } 
      }),
      Task.countDocuments({
        userId,
        dueDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    ]);

    const summary = {
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      todayTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    console.error('Get tasks summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks summary'
    });
  }
});

export default router;