import mongoose, { Document, Schema } from 'mongoose';

export type StreakType = 'login' | 'activity' | 'course';

export interface ILearningStreak extends Document {
  user: mongoose.Types.ObjectId;
  type: StreakType;
  
  // Streak details
  currentStreak: number; // days
  longestStreak: number; // days
  lastActivityDate: Date;
  
  // Course-specific (if type is 'course')
  course?: mongoose.Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const learningStreakSchema = new Schema<ILearningStreak>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['login', 'activity', 'course'],
      required: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
learningStreakSchema.index({ user: 1, type: 1 }, { unique: true });
learningStreakSchema.index({ user: 1, type: 1, course: 1 }, { unique: true, sparse: true });

export default mongoose.model<ILearningStreak>('LearningStreak', learningStreakSchema);

