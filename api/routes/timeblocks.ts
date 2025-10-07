import express, { Request, Response } from 'express';
import { TimeBlock } from '../models/TimeBlock.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { validateTimeBlock } from '../middleware/validation.js';

const router = express.Router();

// Get all time blocks for authenticated user
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { 
      startDate, 
      endDate, 
      type,
      status,
      page = 1,
      limit = 50
    } = req.query;

    const query: any = { userId };

    // Date range filter
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate as string);
      if (endDate) query.startTime.$lte = new Date(endDate as string);
    }

    // Type filter
    if (type) query.type = type;
    
    // Status filter
    if (status) query.status = status;

    const timeBlocks = await TimeBlock.find(query)
      .populate('taskId', 'title status priority')
      .populate('sessionId', 'type duration status')
      .sort({ startTime: 1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await TimeBlock.countDocuments(query);

    res.json({
      success: true,
      data: {
        timeBlocks,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get time blocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching time blocks'
    });
  }
});

// Get time block by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const timeBlockId = req.params.id;

    const timeBlock = await TimeBlock.findOne({ _id: timeBlockId, userId })
      .populate('taskId', 'title description status priority')
      .populate('sessionId', 'type duration status startTime endTime');

    if (!timeBlock) {
      res.status(404).json({
        success: false,
        message: 'Time block not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { timeBlock }
    });
  } catch (error) {
    console.error('Get time block error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching time block'
    });
  }
});

// Create new time block
router.post('/', authenticate, validateTimeBlock, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      type, 
      taskId, 
      color,
      isRecurring,
      recurrencePattern,
      reminders,
      location,
      attendees,
      notes
    } = req.body;

    // Check for time conflicts
    const conflictingBlocks = await TimeBlock.find({
      userId,
      status: { $ne: 'cancelled' },
      $or: [
        {
          startTime: { $lt: new Date(endTime) },
          endTime: { $gt: new Date(startTime) }
        }
      ]
    });

    if (conflictingBlocks.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Time block conflicts with existing schedule',
        data: { conflictingBlocks }
      });
      return;
    }

    const timeBlock = new TimeBlock({
      userId,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      type,
      taskId: taskId || undefined,
      color: color || '#3B82F6',
      isRecurring: isRecurring || false,
      recurrencePattern: isRecurring ? recurrencePattern : undefined,
      reminders: reminders || [],
      location,
      attendees: attendees || [],
      notes
    });

    await timeBlock.save();

    const populatedTimeBlock = await TimeBlock.findById(timeBlock._id)
      .populate('taskId', 'title status priority');

    res.status(201).json({
      success: true,
      message: 'Time block created successfully',
      data: { timeBlock: populatedTimeBlock }
    });
  } catch (error) {
    console.error('Create time block error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating time block'
    });
  }
});

// Update time block
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const timeBlockId = req.params.id;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.userId;
    delete updates.sessionId;

    // If updating time, check for conflicts
    if (updates.startTime || updates.endTime) {
      const currentBlock = await TimeBlock.findOne({ _id: timeBlockId, userId });
      if (!currentBlock) {
        res.status(404).json({
          success: false,
          message: 'Time block not found'
        });
        return;
      }

      const newStartTime = updates.startTime ? new Date(updates.startTime) : currentBlock.startTime;
      const newEndTime = updates.endTime ? new Date(updates.endTime) : currentBlock.endTime;

      const conflictingBlocks = await TimeBlock.find({
        userId,
        _id: { $ne: timeBlockId },
        status: { $ne: 'cancelled' },
        $or: [
          {
            startTime: { $lt: newEndTime },
            endTime: { $gt: newStartTime }
          }
        ]
      });

      if (conflictingBlocks.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Updated time block would conflict with existing schedule',
          data: { conflictingBlocks }
        });
        return;
      }
    }

    const timeBlock = await TimeBlock.findOneAndUpdate(
      { _id: timeBlockId, userId },
      updates,
      { new: true, runValidators: true }
    ).populate('taskId', 'title status priority');

    if (!timeBlock) {
      res.status(404).json({
        success: false,
        message: 'Time block not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Time block updated successfully',
      data: { timeBlock }
    });
  } catch (error) {
    console.error('Update time block error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating time block'
    });
  }
});

// Update time block status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const timeBlockId = req.params.id;
    const { status } = req.body;

    if (!['scheduled', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
      return;
    }

    const timeBlock = await TimeBlock.findOneAndUpdate(
      { _id: timeBlockId, userId },
      { status },
      { new: true, runValidators: true }
    ).populate('taskId', 'title status priority');

    if (!timeBlock) {
      res.status(404).json({
        success: false,
        message: 'Time block not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Time block status updated successfully',
      data: { timeBlock }
    });
  } catch (error) {
    console.error('Update time block status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating time block status'
    });
  }
});

// Delete time block
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const timeBlockId = req.params.id;

    const timeBlock = await TimeBlock.findOneAndDelete({ _id: timeBlockId, userId });

    if (!timeBlock) {
      res.status(404).json({
        success: false,
        message: 'Time block not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Time block deleted successfully'
    });
  } catch (error) {
    console.error('Delete time block error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting time block'
    });
  }
});

// Get time blocks for a specific date range (calendar view)
router.get('/calendar/range', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
      return;
    }

    const timeBlocks = await TimeBlock.find({
      userId,
      startTime: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      },
      status: { $ne: 'cancelled' }
    })
    .populate('taskId', 'title status priority')
    .sort({ startTime: 1 });

    // Group by date for easier calendar rendering
    const groupedByDate: { [key: string]: any[] } = {};
    
    timeBlocks.forEach(block => {
      const dateKey = block.startTime.toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(block);
    });

    res.json({
      success: true,
      data: {
        timeBlocks,
        groupedByDate
      }
    });
  } catch (error) {
    console.error('Get calendar time blocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching calendar time blocks'
    });
  }
});

// Get today's time blocks
router.get('/today/schedule', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const timeBlocks = await TimeBlock.find({
      userId,
      startTime: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $ne: 'cancelled' }
    })
    .populate('taskId', 'title status priority')
    .populate('sessionId', 'type duration status')
    .sort({ startTime: 1 });

    const now = new Date();
    const currentBlock = timeBlocks.find(block => 
      block.startTime <= now && block.endTime > now && block.status === 'in-progress'
    );

    const nextBlock = timeBlocks.find(block => 
      block.startTime > now && block.status === 'scheduled'
    );

    res.json({
      success: true,
      data: {
        timeBlocks,
        currentBlock,
        nextBlock,
        totalBlocks: timeBlocks.length
      }
    });
  } catch (error) {
    console.error('Get today schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching today\'s schedule'
    });
  }
});

// Get time block statistics
router.get('/stats/overview', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
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

    const [
      totalBlocks,
      completedBlocks,
      cancelledBlocks,
      inProgressBlocks,
      scheduledBlocks
    ] = await Promise.all([
      TimeBlock.countDocuments({
        userId,
        startTime: { $gte: startDate, $lte: endDate }
      }),
      TimeBlock.countDocuments({
        userId,
        status: 'completed',
        startTime: { $gte: startDate, $lte: endDate }
      }),
      TimeBlock.countDocuments({
        userId,
        status: 'cancelled',
        startTime: { $gte: startDate, $lte: endDate }
      }),
      TimeBlock.countDocuments({
        userId,
        status: 'in-progress',
        startTime: { $gte: startDate, $lte: endDate }
      }),
      TimeBlock.countDocuments({
        userId,
        status: 'scheduled',
        startTime: { $gte: startDate, $lte: endDate }
      })
    ]);

    const completionRate = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

    const stats = {
      totalBlocks,
      completedBlocks,
      cancelledBlocks,
      inProgressBlocks,
      scheduledBlocks,
      completionRate,
      period
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get time block stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching time block statistics'
    });
  }
});

export default router;