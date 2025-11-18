import mongoose, { Document, Schema } from 'mongoose';

export interface ILearningPathProgress extends Document {
  user: mongoose.Types.ObjectId;
  learningPath: mongoose.Types.ObjectId;
  
  // Progress tracking
  currentCourseIndex: number; // Index in the path's courses array
  completedCourses: mongoose.Types.ObjectId[];
  progressPercentage: number;
  
  // Status
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  
  // Dates
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt?: Date;
  
  // Milestones
  completedMilestones: Array<{
    milestoneIndex: number;
    completedAt: Date;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const learningPathProgressSchema = new Schema<ILearningPathProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    learningPath: {
      type: Schema.Types.ObjectId,
      ref: 'LearningPath',
      required: true,
    },
    currentCourseIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedCourses: [{
      type: Schema.Types.ObjectId,
      ref: 'Course',
    }],
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'paused'],
      default: 'not_started',
    },
    startedAt: Date,
    completedAt: Date,
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    completedMilestones: [{
      milestoneIndex: Number,
      completedAt: Date,
    }],
  },
  {
    timestamps: true,
  }
);

learningPathProgressSchema.index({ user: 1, learningPath: 1 }, { unique: true });
learningPathProgressSchema.index({ user: 1, status: 1 });
learningPathProgressSchema.index({ learningPath: 1, status: 1 });

export default mongoose.model<ILearningPathProgress>('LearningPathProgress', learningPathProgressSchema);

