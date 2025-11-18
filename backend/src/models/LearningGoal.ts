import mongoose, { Document, Schema } from 'mongoose';

export type GoalType = 
  | 'complete_courses'
  | 'earn_xp'
  | 'reach_level'
  | 'complete_assignments'
  | 'complete_lessons'
  | 'maintain_streak'
  | 'share_projects'
  | 'custom';

export type GoalStatus = 'active' | 'completed' | 'failed' | 'paused';

export interface ILearningGoal extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: GoalType;
  
  // Goal target
  targetValue: number;
  currentValue: number;
  
  // Custom goal details (for custom type)
  customCriteria?: {
    type: string;
    value: any;
    [key: string]: any;
  };
  
  // Deadline
  deadline?: Date;
  hasDeadline: boolean;
  
  // Rewards
  xpReward?: number;
  badgeReward?: mongoose.Types.ObjectId;
  achievementReward?: mongoose.Types.ObjectId;
  
  // Status
  status: GoalStatus;
  completedAt?: Date;
  startedAt: Date;
  
  // Progress tracking
  progressPercentage: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const learningGoalSchema = new Schema<ILearningGoal>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
    },
    description: String,
    type: {
      type: String,
      enum: ['complete_courses', 'earn_xp', 'reach_level', 'complete_assignments', 'complete_lessons', 'maintain_streak', 'share_projects', 'custom'],
      required: true,
    },
    targetValue: {
      type: Number,
      required: true,
      min: 1,
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    customCriteria: {
      type: {
        type: String,
      },
      value: Schema.Types.Mixed,
    },
    deadline: Date,
    hasDeadline: {
      type: Boolean,
      default: false,
    },
    xpReward: {
      type: Number,
      min: 0,
    },
    badgeReward: {
      type: Schema.Types.ObjectId,
      ref: 'Badge',
    },
    achievementReward: {
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'failed', 'paused'],
      default: 'active',
    },
    completedAt: Date,
    startedAt: {
      type: Date,
      default: Date.now,
    },
    progressPercentage: {
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

learningGoalSchema.index({ user: 1, status: 1 });
learningGoalSchema.index({ user: 1, deadline: 1 });
learningGoalSchema.index({ status: 1, deadline: 1 });

export default mongoose.model<ILearningGoal>('LearningGoal', learningGoalSchema);

