import mongoose, { Document, Schema } from 'mongoose';

export interface IPomodoroSession extends Document {
  user: mongoose.Types.ObjectId;
  
  // Session configuration
  workDuration: number; // Work duration in minutes (default 25)
  shortBreakDuration: number; // Short break duration in minutes (default 5)
  longBreakDuration: number; // Long break duration in minutes (default 15)
  longBreakInterval: number; // Number of pomodoros before long break (default 4)
  
  // Current session state
  sessionType: 'work' | 'short_break' | 'long_break';
  currentPomodoro: number; // Current pomodoro number in the cycle
  startTime: Date;
  endTime?: Date;
  duration: number; // Actual duration in seconds
  isCompleted: boolean;
  isPaused: boolean;
  pausedAt?: Date;
  totalPausedTime: number; // Total paused time in seconds
  
  // Related content (optional)
  course?: mongoose.Types.ObjectId;
  lesson?: mongoose.Types.ObjectId;
  activityType?: string; // What the user is studying
  
  // Statistics
  completedPomodoros: number; // Total completed pomodoros in this session
  totalWorkTime: number; // Total work time in seconds
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const pomodoroSessionSchema = new Schema<IPomodoroSession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workDuration: {
      type: Number,
      default: 25,
      min: 1,
      max: 60,
    },
    shortBreakDuration: {
      type: Number,
      default: 5,
      min: 1,
      max: 30,
    },
    longBreakDuration: {
      type: Number,
      default: 15,
      min: 1,
      max: 60,
    },
    longBreakInterval: {
      type: Number,
      default: 4,
      min: 2,
      max: 10,
    },
    sessionType: {
      type: String,
      enum: ['work', 'short_break', 'long_break'],
      default: 'work',
    },
    currentPomodoro: {
      type: Number,
      default: 1,
      min: 1,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: Date,
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    pausedAt: Date,
    totalPausedTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    activityType: String,
    completedPomodoros: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWorkTime: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

pomodoroSessionSchema.index({ user: 1, startTime: -1 });
pomodoroSessionSchema.index({ user: 1, isCompleted: 1 });

export default mongoose.model<IPomodoroSession>('PomodoroSession', pomodoroSessionSchema);

