import mongoose, { Document, Schema } from 'mongoose';

export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'dropped';

export interface ICourseEnrollment extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  
  // Status
  status: EnrollmentStatus;
  
  // Dates
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt?: Date;
  
  // Progress tracking
  progressPercentage: number;
  completedModules: mongoose.Types.ObjectId[];
  completedLessons: mongoose.Types.ObjectId[];
  completedAssignments: mongoose.Types.ObjectId[];
  
  // Time tracking
  timeSpent: number; // in minutes
  estimatedTimeRemaining?: number; // in minutes
  
  // Milestones
  milestones: Array<{
    milestone: string;
    achievedAt: Date;
    xpAwarded?: number;
  }>;
  
  // Completion details
  finalScore?: number;
  passed: boolean;
  passThreshold?: number; // Percentage required to pass
  
  // Resume functionality
  lastLesson?: mongoose.Types.ObjectId;
  lastModule?: mongoose.Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const courseEnrollmentSchema = new Schema<ICourseEnrollment>(
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
    status: {
      type: String,
      enum: ['enrolled', 'in_progress', 'completed', 'dropped'],
      default: 'enrolled',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    startedAt: Date,
    completedAt: Date,
    lastAccessedAt: Date,
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
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
    timeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedTimeRemaining: Number,
    milestones: [{
      milestone: String,
      achievedAt: Date,
      xpAwarded: Number,
    }],
    finalScore: Number,
    passed: {
      type: Boolean,
      default: false,
    },
    passThreshold: {
      type: Number,
      default: 70, // 70% to pass by default
    },
    lastLesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    lastModule: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
    },
  },
  {
    timestamps: true,
  }
);

courseEnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
courseEnrollmentSchema.index({ user: 1, status: 1 });
courseEnrollmentSchema.index({ course: 1, status: 1 });
courseEnrollmentSchema.index({ user: 1, completedAt: -1 });

export default mongoose.model<ICourseEnrollment>('CourseEnrollment', courseEnrollmentSchema);

