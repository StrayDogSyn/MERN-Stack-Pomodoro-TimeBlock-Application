import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeBlock extends Document {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'work' | 'break' | 'meeting' | 'personal' | 'other';
  taskId?: string;
  sessionId?: string;
  color?: string;
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number; // every N days/weeks/months
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    endDate?: Date;
  };
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  reminders: {
    enabled: boolean;
    minutesBefore: number[];
  };
  location?: string;
  attendees?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const timeBlockSchema = new Schema<ITimeBlock>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  title: {
    type: String,
    required: [true, 'Time block title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  type: {
    type: String,
    enum: ['work', 'break', 'meeting', 'personal', 'other'],
    default: 'work'
  },
  taskId: {
    type: String,
    ref: 'Task'
  },
  sessionId: {
    type: String,
    ref: 'Session'
  },
  color: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    interval: {
      type: Number,
      min: [1, 'Interval must be at least 1'],
      max: [365, 'Interval cannot exceed 365']
    },
    daysOfWeek: [{
      type: Number,
      min: [0, 'Day of week must be between 0-6'],
      max: [6, 'Day of week must be between 0-6']
    }],
    endDate: {
      type: Date
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  reminders: {
    enabled: {
      type: Boolean,
      default: true
    },
    minutesBefore: [{
      type: Number,
      min: [0, 'Reminder time cannot be negative'],
      max: [10080, 'Reminder time cannot exceed 7 days (10080 minutes)']
    }]
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  attendees: [{
    type: String,
    trim: true,
    maxlength: [100, 'Attendee name cannot exceed 100 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
timeBlockSchema.index({ userId: 1, startTime: 1 });
timeBlockSchema.index({ userId: 1, endTime: 1 });
timeBlockSchema.index({ userId: 1, status: 1 });
timeBlockSchema.index({ taskId: 1 });
timeBlockSchema.index({ sessionId: 1 });

// Virtual for duration in minutes
timeBlockSchema.virtual('duration').get(function() {
  return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
});

// Virtual for checking if time block is currently active
timeBlockSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.startTime <= now && now <= this.endTime && this.status === 'active';
});

// Validation to ensure end time is after start time
timeBlockSchema.pre('save', function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
  } else {
    next();
  }
});

// Validation for recurring pattern
timeBlockSchema.pre('save', function(next) {
  if (this.isRecurring && !this.recurrencePattern) {
    next(new Error('Recurrence pattern is required for recurring time blocks'));
  } else if (this.isRecurring && this.recurrencePattern) {
    if (this.recurrencePattern.frequency === 'weekly' && (!this.recurrencePattern.daysOfWeek || this.recurrencePattern.daysOfWeek.length === 0)) {
      next(new Error('Days of week are required for weekly recurring time blocks'));
    } else {
      next();
    }
  } else {
    next();
  }
});

export const TimeBlock = mongoose.model<ITimeBlock>('TimeBlock', timeBlockSchema);