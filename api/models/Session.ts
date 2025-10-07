import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  _id: string;
  userId: string;
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number; // in minutes
  actualDuration?: number; // actual time spent in minutes
  status: 'planned' | 'active' | 'completed' | 'paused' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  pausedAt?: Date;
  pausedDuration: number; // total paused time in minutes
  taskId?: string;
  notes?: string;
  tags: string[];
  sessionNumber: number; // session number in the current cycle
  cycleId?: string; // reference to the pomodoro cycle
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['work', 'shortBreak', 'longBreak'],
    required: [true, 'Session type is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [240, 'Duration cannot exceed 240 minutes']
  },
  actualDuration: {
    type: Number,
    min: [0, 'Actual duration cannot be negative'],
    max: [240, 'Actual duration cannot exceed 240 minutes']
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'paused', 'cancelled'],
    default: 'planned'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  pausedAt: {
    type: Date
  },
  pausedDuration: {
    type: Number,
    default: 0,
    min: [0, 'Paused duration cannot be negative']
  },
  taskId: {
    type: String,
    ref: 'Task'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  sessionNumber: {
    type: Number,
    required: [true, 'Session number is required'],
    min: [1, 'Session number must be at least 1']
  },
  cycleId: {
    type: String
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ userId: 1, type: 1, createdAt: -1 });
sessionSchema.index({ taskId: 1 });

// Virtual for calculating actual session time
sessionSchema.virtual('effectiveTime').get(function() {
  if (this.actualDuration !== undefined) {
    return this.actualDuration - this.pausedDuration;
  }
  return 0;
});

// Pre-save middleware to update completedAt when status changes to completed
sessionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

export const Session = mongoose.model<ISession>('Session', sessionSchema);