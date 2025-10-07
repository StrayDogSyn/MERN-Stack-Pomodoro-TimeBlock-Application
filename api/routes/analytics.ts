import express, { Request, Response } from 'express';
import { Session } from '../models/Session.js';
import { Task } from '../models/Task.js';
import { TimeBlock } from '../models/TimeBlock.js';
import { User } from '../models/User.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get productivity overview
router.get('/productivity', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { period = 'week' } = req.query;

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'day':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get session statistics
    const sessions = await Session.find({
      userId,
      startTime: { $gte: startDate, $lte: endDate }
    });

    const completedSessions = sessions.filter(s => s.status === 'completed');
    const workSessions = completedSessions.filter(s => s.type === 'work');
    const breakSessions = completedSessions.filter(s => s.type === 'short-break' || s.type === 'long-break');

    const totalFocusTime = workSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0);
    const totalBreakTime = breakSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0);

    // Get task statistics
    const [totalTasks, completedTasks] = await Promise.all([
      Task.countDocuments({
        userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      Task.countDocuments({
        userId,
        status: 'completed',
        completedAt: { $gte: startDate, $lte: endDate }
      })
    ]);

    // Get time block statistics
    const [totalTimeBlocks, completedTimeBlocks] = await Promise.all([
      TimeBlock.countDocuments({
        userId,
        startTime: { $gte: startDate, $lte: endDate }
      }),
      TimeBlock.countDocuments({
        userId,
        status: 'completed',
        startTime: { $gte: startDate, $lte: endDate }
      })
    ]);

    const productivity = {
      period,
      sessions: {
        total: sessions.length,
        completed: completedSessions.length,
        work: workSessions.length,
        breaks: breakSessions.length,
        completionRate: sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0
      },
      timeSpent: {
        totalFocusTime: Math.round(totalFocusTime / 60), // Convert to minutes
        totalBreakTime: Math.round(totalBreakTime / 60),
        averageSessionLength: workSessions.length > 0 
          ? Math.round(totalFocusTime / workSessions.length / 60) 
          : 0,
        focusBreakRatio: totalBreakTime > 0 ? Math.round((totalFocusTime / totalBreakTime) * 100) / 100 : 0
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      timeBlocks: {
        total: totalTimeBlocks,
        completed: completedTimeBlocks,
        completionRate: totalTimeBlocks > 0 ? Math.round((completedTimeBlocks / totalTimeBlocks) * 100) : 0
      }
    };

    res.json({
      success: true,
      data: { productivity }
    });
  } catch (error) {
    console.error('Get productivity analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching productivity analytics'
    });
  }
});

// Get daily activity chart data
router.get('/daily-activity', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { days = 7 } = req.query;

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - Number(days) * 24 * 60 * 60 * 1000);

    const sessions = await Session.find({
      userId,
      startTime: { $gte: startDate, $lte: endDate },
      status: 'completed'
    }).sort({ startTime: 1 });

    // Group sessions by date
    const dailyData: { [key: string]: any } = {};
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyData[dateKey] = {
        date: dateKey,
        workSessions: 0,
        breakSessions: 0,
        focusTime: 0,
        breakTime: 0,
        completedTasks: 0
      };
    }

    sessions.forEach(session => {
      const dateKey = session.startTime.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        if (session.type === 'work') {
          dailyData[dateKey].workSessions++;
          dailyData[dateKey].focusTime += Math.round((session.actualDuration || session.duration) / 60);
        } else {
          dailyData[dateKey].breakSessions++;
          dailyData[dateKey].breakTime += Math.round((session.actualDuration || session.duration) / 60);
        }
      }
    });

    // Get completed tasks per day
    const tasks = await Task.find({
      userId,
      status: 'completed',
      completedAt: { $gte: startDate, $lte: endDate }
    });

    tasks.forEach(task => {
      if (task.completedAt) {
        const dateKey = task.completedAt.toISOString().split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].completedTasks++;
        }
      }
    });

    const chartData = Object.values(dailyData);

    res.json({
      success: true,
      data: { chartData }
    });
  } catch (error) {
    console.error('Get daily activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching daily activity data'
    });
  }
});

// Get focus time trends
router.get('/focus-trends', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { period = 'week' } = req.query;

    let groupBy: string;
    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case 'month':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case 'year':
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupBy = 'month';
        break;
      default:
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
    }

    const sessions = await Session.find({
      userId,
      type: 'work',
      status: 'completed',
      startTime: { $gte: startDate, $lte: endDate }
    }).sort({ startTime: 1 });

    const trendsData: { [key: string]: any } = {};

    sessions.forEach(session => {
      let key: string;
      if (groupBy === 'day') {
        key = session.startTime.toISOString().split('T')[0];
      } else {
        key = `${session.startTime.getFullYear()}-${String(session.startTime.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!trendsData[key]) {
        trendsData[key] = {
          period: key,
          sessions: 0,
          totalTime: 0,
          averageTime: 0
        };
      }

      trendsData[key].sessions++;
      trendsData[key].totalTime += Math.round((session.actualDuration || session.duration) / 60);
    });

    // Calculate averages
    Object.values(trendsData).forEach((data: any) => {
      data.averageTime = data.sessions > 0 ? Math.round(data.totalTime / data.sessions) : 0;
    });

    const chartData = Object.values(trendsData);

    res.json({
      success: true,
      data: { chartData, period }
    });
  } catch (error) {
    console.error('Get focus trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching focus trends'
    });
  }
});

// Get task completion analytics
router.get('/task-completion', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { period = 'month' } = req.query;

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get task statistics by priority
    const tasksByPriority = await Task.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$priority',
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get task statistics by category
    const tasksByCategory = await Task.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          totalPomodoros: { $sum: '$estimatedPomodoros' },
          completedPomodoros: { $sum: '$completedPomodoros' }
        }
      }
    ]);

    // Calculate completion rates
    const priorityData = tasksByPriority.map(item => ({
      priority: item._id || 'unassigned',
      total: item.total,
      completed: item.completed,
      completionRate: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0
    }));

    const categoryData = tasksByCategory.map(item => ({
      category: item._id || 'uncategorized',
      total: item.total,
      completed: item.completed,
      completionRate: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
      pomodoroEfficiency: item.totalPomodoros > 0 
        ? Math.round((item.completedPomodoros / item.totalPomodoros) * 100) 
        : 0
    }));

    res.json({
      success: true,
      data: {
        period,
        byPriority: priorityData,
        byCategory: categoryData
      }
    });
  } catch (error) {
    console.error('Get task completion analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task completion analytics'
    });
  }
});

// Get time distribution analytics
router.get('/time-distribution', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { period = 'week' } = req.query;

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'day':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get time distribution by session type
    const sessionDistribution = await Session.aggregate([
      {
        $match: {
          userId,
          status: 'completed',
          startTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalTime: { 
            $sum: { 
              $ifNull: ['$actualDuration', '$duration'] 
            } 
          }
        }
      }
    ]);

    // Get time distribution by task category
    const taskTimeDistribution = await Session.aggregate([
      {
        $match: {
          userId,
          type: 'work',
          status: 'completed',
          startTime: { $gte: startDate, $lte: endDate },
          taskId: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'tasks',
          localField: 'taskId',
          foreignField: '_id',
          as: 'task'
        }
      },
      {
        $unwind: '$task'
      },
      {
        $group: {
          _id: '$task.category',
          count: { $sum: 1 },
          totalTime: { 
            $sum: { 
              $ifNull: ['$actualDuration', '$duration'] 
            } 
          }
        }
      }
    ]);

    // Convert seconds to minutes and calculate percentages
    const totalSessionTime = sessionDistribution.reduce((sum, item) => sum + item.totalTime, 0);
    const totalTaskTime = taskTimeDistribution.reduce((sum, item) => sum + item.totalTime, 0);

    const sessionData = sessionDistribution.map(item => ({
      type: item._id,
      count: item.count,
      time: Math.round(item.totalTime / 60), // Convert to minutes
      percentage: totalSessionTime > 0 ? Math.round((item.totalTime / totalSessionTime) * 100) : 0
    }));

    const taskCategoryData = taskTimeDistribution.map(item => ({
      category: item._id || 'uncategorized',
      count: item.count,
      time: Math.round(item.totalTime / 60), // Convert to minutes
      percentage: totalTaskTime > 0 ? Math.round((item.totalTime / totalTaskTime) * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        period,
        sessionTypes: sessionData,
        taskCategories: taskCategoryData,
        totalTime: {
          sessions: Math.round(totalSessionTime / 60),
          tasks: Math.round(totalTaskTime / 60)
        }
      }
    });
  } catch (error) {
    console.error('Get time distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching time distribution analytics'
    });
  }
});

// Get streak and consistency data
router.get('/streaks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - Number(days) * 24 * 60 * 60 * 1000);

    // Get daily session data
    const sessions = await Session.find({
      userId,
      type: 'work',
      status: 'completed',
      startTime: { $gte: startDate, $lte: endDate }
    }).sort({ startTime: 1 });

    // Group sessions by date
    const dailySessions: { [key: string]: number } = {};
    
    sessions.forEach(session => {
      const dateKey = session.startTime.toISOString().split('T')[0];
      dailySessions[dateKey] = (dailySessions[dateKey] || 0) + 1;
    });

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];

    // Check current streak (working backwards from today)
    for (let d = new Date(); d >= startDate; d.setDate(d.getDate() - 1)) {
      const dateKey = d.toISOString().split('T')[0];
      if (dailySessions[dateKey] && dailySessions[dateKey] > 0) {
        if (dateKey === today || currentStreak > 0) {
          currentStreak++;
        }
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      if (dailySessions[dateKey] && dailySessions[dateKey] > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate consistency metrics
    const totalDays = Number(days);
    const activeDays = Object.keys(dailySessions).length;
    const consistencyRate = Math.round((activeDays / totalDays) * 100);

    const averageSessionsPerDay = activeDays > 0 
      ? Math.round((sessions.length / activeDays) * 10) / 10 
      : 0;

    res.json({
      success: true,
      data: {
        currentStreak,
        longestStreak,
        consistencyRate,
        activeDays,
        totalDays,
        averageSessionsPerDay,
        dailyActivity: Object.entries(dailySessions).map(([date, count]) => ({
          date,
          sessions: count
        }))
      }
    });
  } catch (error) {
    console.error('Get streaks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching streak data'
    });
  }
});

export default router;