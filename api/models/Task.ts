import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
  estimatedPomodoros: number;
  completedPomodoros: number;
  category?: string;
  tags: string[];
  dueDate?: Date;
  completedAt?: Date;
  sessionIds: string[]; // references to associated sessions
  timeSpent: number; // total time spent in minutes
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Task description cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed', 'cancelled'],
    default: 'todo'
  },
  estimatedPomodoros: {
    type: Number,
    required: [true, 'Estimated pomodoros is required'],
    min: [1, 'Estimated pomodoros must be at least 1'],
    max: [50, 'Estimated pomodoros cannot exceed 50']
  },
  completedPomodoros: {
    type: Number,
    default: 0,
    min: [0, 'Completed pomodoros cannot be negative']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  sessionIds: [{
    type: String,
    ref: 'Session'
  }],
  timeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time spent cannot be negative']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });

// Virtual for completion percentage
taskSchema.virtual('completionPercentage').get(function() {
  if (this.estimatedPomodoros === 0) return 0;
  return Math.min(100, Math.round((this.completedPomodoros / this.estimatedPomodoros) * 100));
});

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Pre-save middleware to update completedAt when status changes to completed
taskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

export const Task = mongoose.model<ITask>('Task', taskSchema);