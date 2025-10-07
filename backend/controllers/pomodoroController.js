const PomodoroSession = require('../models/PomodoroSession');
const Task = require('../models/Task');

// @desc    Get all pomodoro sessions for user
// @route   GET /api/pomodoro
// @access  Private
const getPomodoroSessions = async (req, res) => {
  try {
    const sessions = await PomodoroSession.find({ user: req.user._id })
      .populate('task', 'title category')
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new pomodoro session
// @route   POST /api/pomodoro
// @access  Private
const createPomodoroSession = async (req, res) => {
  try {
    const session = await PomodoroSession.create({
      user: req.user._id,
      ...req.body
    });
    const populatedSession = await PomodoroSession.findById(session._id)
      .populate('task', 'title category');
    res.status(201).json(populatedSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete pomodoro session
// @route   PUT /api/pomodoro/:id/complete
// @access  Private
const completePomodoroSession = async (req, res) => {
  try {
    const session = await PomodoroSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check user
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    session.completed = true;
    session.endTime = new Date();
    await session.save();

    // Update task completed pomodoros if session is linked to a task
    if (session.task && session.type === 'work') {
      const task = await Task.findById(session.task);
      if (task) {
        task.completedPomodoros += 1;
        await task.save();
      }
    }

    const populatedSession = await PomodoroSession.findById(session._id)
      .populate('task', 'title category');
    res.json(populatedSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get productivity analytics
// @route   GET /api/pomodoro/analytics
// @access  Private
const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {
      user: req.user._id,
      completed: true
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sessions = await PomodoroSession.find(query).populate('task', 'category');

    // Calculate statistics
    const totalSessions = sessions.length;
    const workSessions = sessions.filter(s => s.type === 'work').length;
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

    // Group by category
    const categoryStats = {};
    sessions.forEach(session => {
      if (session.task && session.task.category) {
        const cat = session.task.category;
        if (!categoryStats[cat]) {
          categoryStats[cat] = { count: 0, duration: 0 };
        }
        categoryStats[cat].count += 1;
        categoryStats[cat].duration += session.duration;
      }
    });

    // Group by date
    const dailyStats = {};
    sessions.forEach(session => {
      const date = session.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { count: 0, duration: 0 };
      }
      dailyStats[date].count += 1;
      dailyStats[date].duration += session.duration;
    });

    res.json({
      totalSessions,
      workSessions,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      categoryStats,
      dailyStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPomodoroSessions,
  createPomodoroSession,
  completePomodoroSession,
  getAnalytics
};
