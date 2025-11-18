import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseCompletion extends Document {
  enrollment: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  
  // Completion details
  completedAt: Date;
  timeToComplete: number; // in days
  totalTimeSpent: number; // in minutes
  
  // Scores
  finalScore: number;
  averageScore: number;
  passed: boolean;
  
  // Rewards
  xpEarned: number;
  badgesEarned: mongoose.Types.ObjectId[];
  achievementsEarned: mongoose.Types.ObjectId[];
  
  // Sharing
  shared: boolean;
  sharedAt?: Date;
  shareableLink?: string;
  
  // Celebration
  celebrationViewed: boolean;
  celebrationViewedAt?: Date;
  
  // Analytics
  totalAssignments: number;
  completedAssignments: number;
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  
  // Streak data
  learningStreakAtCompletion?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const courseCompletionSchema = new Schema<ICourseCompletion>(
  {
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'CourseEnrollment',
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    timeToComplete: {
      type: Number,
      required: true,
      min: 0,
    },
    totalTimeSpent: {
      type: Number,
      required: true,
      min: 0,
    },
    finalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    averageScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    xpEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    badgesEarned: [{
      type: Schema.Types.ObjectId,
      ref: 'Badge',
    }],
    achievementsEarned: [{
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
    }],
    shared: {
      type: Boolean,
      default: false,
    },
    sharedAt: Date,
    shareableLink: String,
    celebrationViewed: {
      type: Boolean,
      default: false,
    },
    celebrationViewedAt: Date,
    totalAssignments: {
      type: Number,
      required: true,
    },
    completedAssignments: {
      type: Number,
      required: true,
    },
    totalModules: {
      type: Number,
      required: true,
    },
    completedModules: {
      type: Number,
      required: true,
    },
    totalLessons: {
      type: Number,
      required: true,
    },
    completedLessons: {
      type: Number,
      required: true,
    },
    learningStreakAtCompletion: Number,
  },
  {
    timestamps: true,
  }
);

courseCompletionSchema.index({ user: 1, completedAt: -1 });
courseCompletionSchema.index({ course: 1, completedAt: -1 });
courseCompletionSchema.index({ user: 1, course: 1 }, { unique: true });
courseCompletionSchema.index({ shareableLink: 1 }, { sparse: true });

export default mongoose.model<ICourseCompletion>('CourseCompletion', courseCompletionSchema);

