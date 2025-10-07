import express, { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { Task } from '../models/Task.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// Update user profile
router.patch('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { username, email, firstName, lastName } = req.body;

    // Check if username or email already exists (excluding current user)
    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ]
      });

      if (existingUser) {
        const field = existingUser.username === username ? 'Username' : 'Email';
        res.status(400).json({
          success: false,
          message: `${field} already exists`
        });
        return;
      }
    }

    const updates: any = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// Update user preferences
router.patch('/preferences', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      res.status(400).json({
        success: false,
        message: 'Valid preferences object is required'
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { preferences },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating preferences'
    });
  }
});

// Change password
router.patch('/password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
});

// Get user statistics
router.get('/stats', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { period = 'all' } = req.query;

    let startDate: Date | undefined;
    const endDate = new Date();

    if (period !== 'all') {
      switch (period) {
        case 'week':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const dateFilter = startDate ? { $gte: startDate, $lte: endDate } : {};

    // Get session statistics
    const sessionStats = await Session.aggregate([
      {
        $match: {
          userId,
          ...(startDate && { startTime: dateFilter })
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalFocusTime: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'work'] },
                { $ifNull: ['$actualDuration', '$duration'] },
                0
              ]
            }
          },
          totalBreakTime: {
            $sum: {
              $cond: [
                { $in: ['$type', ['short-break', 'long-break']] },
                { $ifNull: ['$actualDuration', '$duration'] },
                0
              ]
            }
          }
        }
      }
    ]);

    // Get task statistics
    const taskStats = await Task.aggregate([
      {
        $match: {
          userId,
          ...(startDate && { createdAt: dateFilter })
        }
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalEstimatedPomodoros: { $sum: '$estimatedPomodoros' },
          totalCompletedPomodoros: { $sum: '$completedPomodoros' }
        }
      }
    ]);

    // Get user's current stats from User model
    const user = await User.findById(userId).select('stats');

    const sessionData = sessionStats[0] || {
      totalSessions: 0,
      completedSessions: 0,
      totalFocusTime: 0,
      totalBreakTime: 0
    };

    const taskData = taskStats[0] || {
      totalTasks: 0,
      completedTasks: 0,
      totalEstimatedPomodoros: 0,
      totalCompletedPomodoros: 0
    };

    const stats = {
      period,
      sessions: {
        total: sessionData.totalSessions,
        completed: sessionData.completedSessions,
        completionRate: sessionData.totalSessions > 0 
          ? Math.round((sessionData.completedSessions / sessionData.totalSessions) * 100) 
          : 0
      },
      timeSpent: {
        focusTime: Math.round(sessionData.totalFocusTime / 60), // Convert to minutes
        breakTime: Math.round(sessionData.totalBreakTime / 60),
        totalTime: Math.round((sessionData.totalFocusTime + sessionData.totalBreakTime) / 60)
      },
      tasks: {
        total: taskData.totalTasks,
        completed: taskData.completedTasks,
        completionRate: taskData.totalTasks > 0 
          ? Math.round((taskData.completedTasks / taskData.totalTasks) * 100) 
          : 0
      },
      pomodoros: {
        estimated: taskData.totalEstimatedPomodoros,
        completed: taskData.totalCompletedPomodoros,
        efficiency: taskData.totalEstimatedPomodoros > 0 
          ? Math.round((taskData.totalCompletedPomodoros / taskData.totalEstimatedPomodoros) * 100) 
          : 0
      },
      overall: user?.stats || {
        totalFocusTime: 0,
        totalSessions: 0,
        completedTasks: 0,
        currentStreak: 0,
        longestStreak: 0
      }
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
});

// Delete user account
router.delete('/account', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
      return;
    }

    // Delete all user data
    await Promise.all([
      User.findByIdAndDelete(userId),
      Session.deleteMany({ userId }),
      Task.deleteMany({ userId })
    ]);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account'
    });
  }
});

// Get user achievements/badges
router.get('/achievements', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    // Get user stats
    const user = await User.findById(userId).select('stats');
    const userStats = user?.stats || {};

    // Get recent activity for dynamic achievements
    const recentSessions = await Session.find({
      userId,
      status: 'completed',
      startTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    const recentTasks = await Task.find({
      userId,
      status: 'completed',
      completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Calculate achievements
    const achievements = [];

    // Session-based achievements
    if (userStats.totalSessions >= 1) achievements.push({ id: 'first_session', name: 'First Session', description: 'Complete your first Pomodoro session', unlocked: true });
    if (userStats.totalSessions >= 10) achievements.push({ id: 'session_10', name: 'Getting Started', description: 'Complete 10 Pomodoro sessions', unlocked: true });
    if (userStats.totalSessions >= 50) achievements.push({ id: 'session_50', name: 'Focused Mind', description: 'Complete 50 Pomodoro sessions', unlocked: true });
    if (userStats.totalSessions >= 100) achievements.push({ id: 'session_100', name: 'Centurion', description: 'Complete 100 Pomodoro sessions', unlocked: true });

    // Task-based achievements
    if (userStats.completedTasks >= 1) achievements.push({ id: 'first_task', name: 'Task Master', description: 'Complete your first task', unlocked: true });
    if (userStats.completedTasks >= 25) achievements.push({ id: 'task_25', name: 'Productive', description: 'Complete 25 tasks', unlocked: true });
    if (userStats.completedTasks >= 100) achievements.push({ id: 'task_100', name: 'Achievement Hunter', description: 'Complete 100 tasks', unlocked: true });

    // Streak-based achievements
    if (userStats.currentStreak >= 3) achievements.push({ id: 'streak_3', name: 'On Fire', description: 'Maintain a 3-day streak', unlocked: true });
    if (userStats.currentStreak >= 7) achievements.push({ id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', unlocked: true });
    if (userStats.longestStreak >= 30) achievements.push({ id: 'streak_30', name: 'Consistency King', description: 'Achieve a 30-day streak', unlocked: true });

    // Time-based achievements
    const totalHours = Math.floor((userStats.totalFocusTime || 0) / 3600);
    if (totalHours >= 1) achievements.push({ id: 'hour_1', name: 'First Hour', description: 'Focus for 1 hour total', unlocked: true });
    if (totalHours >= 25) achievements.push({ id: 'hour_25', name: 'Focused Professional', description: 'Focus for 25 hours total', unlocked: true });
    if (totalHours >= 100) achievements.push({ id: 'hour_100', name: 'Time Master', description: 'Focus for 100 hours total', unlocked: true });

    // Recent activity achievements
    if (recentSessions.length >= 20) achievements.push({ id: 'monthly_active', name: 'Monthly Active', description: 'Complete 20 sessions this month', unlocked: true });
    if (recentTasks.length >= 10) achievements.push({ id: 'monthly_productive', name: 'Monthly Productive', description: 'Complete 10 tasks this month', unlocked: true });

    res.json({
      success: true,
      data: { 
        achievements,
        totalUnlocked: achievements.length,
        recentActivity: {
          sessionsThisMonth: recentSessions.length,
          tasksThisMonth: recentTasks.length
        }
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching achievements'
    });
  }
});

export default router;