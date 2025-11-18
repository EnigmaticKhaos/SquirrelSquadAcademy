import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseTestSession extends Document {
  user: mongoose.Types.ObjectId; // Admin/tester user
  course: mongoose.Types.ObjectId;
  
  // Simulated progress
  simulatedXP: number;
  simulatedLevel: number;
  simulatedProgress: number;
  
  // Simulated achievements/badges
  simulatedAchievements: mongoose.Types.ObjectId[];
  simulatedBadges: mongoose.Types.ObjectId[];
  
  // Test progress
  completedModules: mongoose.Types.ObjectId[];
  completedLessons: mongoose.Types.ObjectId[];
  completedAssignments: mongoose.Types.ObjectId[];
  
  // Test results
  validationReport?: {
    contentIssues: string[];
    flowIssues: string[];
    brokenLinks: string[];
    missingPrerequisites: string[];
    warnings: string[];
    passed: boolean;
  };
  
  // Timestamps
  startedAt: Date;
  lastAccessedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const courseTestSessionSchema = new Schema<ICourseTestSession>(
  {
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
    simulatedXP: {
      type: Number,
      default: 0,
    },
    simulatedLevel: {
      type: Number,
      default: 1,
    },
    simulatedProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    simulatedAchievements: [{
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
    }],
    simulatedBadges: [{
      type: Schema.Types.ObjectId,
      ref: 'Badge',
    }],
    completedModules: [{
      type: Schema.Types.ObjectId,
      ref: 'Module',
    }],
    completedLessons: [{
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    }],
    completedAssignments: [{
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
    }],
    validationReport: {
      contentIssues: [String],
      flowIssues: [String],
      brokenLinks: [String],
      missingPrerequisites: [String],
      warnings: [String],
      passed: Boolean,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

courseTestSessionSchema.index({ user: 1, course: 1 }, { unique: true });
courseTestSessionSchema.index({ course: 1 });

export default mongoose.model<ICourseTestSession>('CourseTestSession', courseTestSessionSchema);

