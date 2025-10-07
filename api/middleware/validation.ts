import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { username, email, password, firstName, lastName } = req.body;
  const errors: ValidationError[] = [];

  // Username validation
  if (!username) {
    errors.push({ field: 'username', message: 'Username is required' });
  } else if (username.length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
  } else if (username.length > 30) {
    errors.push({ field: 'username', message: 'Username cannot exceed 30 characters' });
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push({ field: 'username', message: 'Username can only contain letters, numbers, and underscores' });
  }

  // Email validation
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validator.isEmail(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  // Password validation
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push({ 
      field: 'password', 
      message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number' 
    });
  }

  // Optional field validation
  if (firstName && firstName.length > 50) {
    errors.push({ field: 'firstName', message: 'First name cannot exceed 50 characters' });
  }

  if (lastName && lastName.length > 50) {
    errors.push({ field: 'lastName', message: 'Last name cannot exceed 50 characters' });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;
  const errors: ValidationError[] = [];

  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validator.isEmail(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

export const validateTask = (req: Request, res: Response, next: NextFunction): void => {
  const { title, estimatedPomodoros, priority, dueDate } = req.body;
  const errors: ValidationError[] = [];

  if (!title) {
    errors.push({ field: 'title', message: 'Task title is required' });
  } else if (title.length > 200) {
    errors.push({ field: 'title', message: 'Task title cannot exceed 200 characters' });
  }

  if (!estimatedPomodoros) {
    errors.push({ field: 'estimatedPomodoros', message: 'Estimated pomodoros is required' });
  } else if (!Number.isInteger(estimatedPomodoros) || estimatedPomodoros < 1 || estimatedPomodoros > 50) {
    errors.push({ field: 'estimatedPomodoros', message: 'Estimated pomodoros must be between 1 and 50' });
  }

  if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
    errors.push({ field: 'priority', message: 'Priority must be one of: low, medium, high, urgent' });
  }

  if (dueDate && !validator.isISO8601(dueDate)) {
    errors.push({ field: 'dueDate', message: 'Due date must be a valid ISO 8601 date' });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

export const validateTimeBlock = (req: Request, res: Response, next: NextFunction): void => {
  const { title, startTime, endTime, type, color } = req.body;
  const errors: ValidationError[] = [];

  if (!title) {
    errors.push({ field: 'title', message: 'Time block title is required' });
  } else if (title.length > 200) {
    errors.push({ field: 'title', message: 'Title cannot exceed 200 characters' });
  }

  if (!startTime) {
    errors.push({ field: 'startTime', message: 'Start time is required' });
  } else if (!validator.isISO8601(startTime)) {
    errors.push({ field: 'startTime', message: 'Start time must be a valid ISO 8601 date' });
  }

  if (!endTime) {
    errors.push({ field: 'endTime', message: 'End time is required' });
  } else if (!validator.isISO8601(endTime)) {
    errors.push({ field: 'endTime', message: 'End time must be a valid ISO 8601 date' });
  }

  if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
    errors.push({ field: 'endTime', message: 'End time must be after start time' });
  }

  if (type && !['work', 'break', 'meeting', 'personal', 'other'].includes(type)) {
    errors.push({ field: 'type', message: 'Type must be one of: work, break, meeting, personal, other' });
  }

  if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    errors.push({ field: 'color', message: 'Color must be a valid hex color' });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

export const validateSession = (req: Request, res: Response, next: NextFunction): void => {
  const { type, duration, taskId } = req.body;
  const errors: ValidationError[] = [];

  if (!type) {
    errors.push({ field: 'type', message: 'Session type is required' });
  } else if (!['work', 'shortBreak', 'longBreak'].includes(type)) {
    errors.push({ field: 'type', message: 'Type must be one of: work, shortBreak, longBreak' });
  }

  if (!duration) {
    errors.push({ field: 'duration', message: 'Duration is required' });
  } else if (!Number.isInteger(duration) || duration < 1 || duration > 240) {
    errors.push({ field: 'duration', message: 'Duration must be between 1 and 240 minutes' });
  }

  if (taskId && !validator.isMongoId(taskId)) {
    errors.push({ field: 'taskId', message: 'Task ID must be a valid MongoDB ObjectId' });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};