import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoProgress extends Document {
  user: mongoose.Types.ObjectId;
  lesson: mongoose.Types.ObjectId;
  
  // Playback progress
  currentTime: number; // in seconds
  duration: number; // in seconds
  progressPercentage: number; // 0-100
  completed: boolean;
  
  // Playback settings
  playbackSpeed: number; // e.g., 1.0, 1.25, 1.5, etc.
  volume: number; // 0-1
  muted: boolean;
  captionsEnabled: boolean;
  captionsLanguage?: string;
  
  // Completion tracking
  watchedAt?: Date;
  completedAt?: Date;
  
  // Timestamps
  lastWatchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const videoProgressSchema = new Schema<IVideoProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    currentTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    playbackSpeed: {
      type: Number,
      default: 1.0,
      min: 0.25,
      max: 2.0,
    },
    volume: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    muted: {
      type: Boolean,
      default: false,
    },
    captionsEnabled: {
      type: Boolean,
      default: false,
    },
    captionsLanguage: String,
    watchedAt: Date,
    completedAt: Date,
    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

videoProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });
videoProgressSchema.index({ user: 1, completed: 1 });
videoProgressSchema.index({ lesson: 1 });

export default mongoose.model<IVideoProgress>('VideoProgress', videoProgressSchema);

