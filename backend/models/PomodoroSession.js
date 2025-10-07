const mongoose = require('mongoose');

const pomodoroSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  duration: {
    type: Number,
    required: true,
    default: 25
  },
  type: {
    type: String,
    enum: ['work', 'shortBreak', 'longBreak'],
    default: 'work'
  },
  completed: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PomodoroSession', pomodoroSessionSchema);
