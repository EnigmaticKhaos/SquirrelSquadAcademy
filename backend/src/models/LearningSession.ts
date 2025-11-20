import mongoose, { Document, Schema } from 'mongoose';

export interface ILearningSession extends Document {
  user: mongoose.Types.ObjectId;
  course?: mongoose.Types.ObjectId;
  lesson?: mongoose.Types.ObjectId;
  module?: mongoose.Types.ObjectId;
  
  // Session details
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  
  // Activity
  activityType: 'lesson' | 'quiz' | 'assignment' | 'video' | 'reading' | 'practice';
  actions: Array<{
    type: string;
    timestamp: Date;
    metadata?: any;
  }>;
  
  // Progress
  progressBefore: number; // percentage
  progressAfter: number; // percentage
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const learningSessionSchema = new Schema<ILearningSession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    module: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: Date,
    duration: {
      type: Number,
      default: 0,
    },
    activityType: {
      type: String,
      enum: ['lesson', 'quiz', 'assignment', 'video', 'reading', 'practice'],
      required: true,
    },
    actions: [{
      type: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      metadata: Schema.Types.Mixed,
    }],
    progressBefore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    progressAfter: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
learningSessionSchema.index({ user: 1, startTime: -1 });
learningSessionSchema.index({ course: 1, user: 1 });
learningSessionSchema.index({ startTime: 1 });

export default mongoose.model<ILearningSession>('LearningSession', learningSessionSchema);

