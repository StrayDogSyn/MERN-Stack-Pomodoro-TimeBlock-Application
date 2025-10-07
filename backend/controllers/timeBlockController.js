const TimeBlock = require('../models/TimeBlock');

// @desc    Get all time blocks for user
// @route   GET /api/timeblocks
// @access  Private
const getTimeBlocks = async (req, res) => {
  try {
    const timeBlocks = await TimeBlock.find({ user: req.user._id })
      .populate('task', 'title category')
      .sort({ startTime: 1 });
    res.json(timeBlocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new time block
// @route   POST /api/timeblocks
// @access  Private
const createTimeBlock = async (req, res) => {
  try {
    const timeBlock = await TimeBlock.create({
      user: req.user._id,
      ...req.body
    });
    const populatedTimeBlock = await TimeBlock.findById(timeBlock._id)
      .populate('task', 'title category');
    res.status(201).json(populatedTimeBlock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update time block
// @route   PUT /api/timeblocks/:id
// @access  Private
const updateTimeBlock = async (req, res) => {
  try {
    const timeBlock = await TimeBlock.findById(req.params.id);

    if (!timeBlock) {
      return res.status(404).json({ message: 'Time block not found' });
    }

    // Check user
    if (timeBlock.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedTimeBlock = await TimeBlock.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('task', 'title category');

    res.json(updatedTimeBlock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete time block
// @route   DELETE /api/timeblocks/:id
// @access  Private
const deleteTimeBlock = async (req, res) => {
  try {
    const timeBlock = await TimeBlock.findById(req.params.id);

    if (!timeBlock) {
      return res.status(404).json({ message: 'Time block not found' });
    }

    // Check user
    if (timeBlock.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await timeBlock.deleteOne();
    res.json({ message: 'Time block removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTimeBlocks, createTimeBlock, updateTimeBlock, deleteTimeBlock };
