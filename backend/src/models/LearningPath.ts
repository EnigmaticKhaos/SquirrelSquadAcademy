import mongoose, { Document, Schema } from 'mongoose';

export type LearningPathType = 'curated' | 'ai-powered';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ILearningPath extends Document {
  name: string;
  description: string;
  type: LearningPathType;
  
  // Course structure
  courses: Array<{
    course: mongoose.Types.ObjectId;
    order: number;
    isRequired: boolean;
  }>;
  
  // Prerequisites
  prerequisites: mongoose.Types.ObjectId[]; // Other learning paths
  requiredCourses?: mongoose.Types.ObjectId[]; // Specific courses that must be completed first
  
  // Metadata
  estimatedDuration: number; // in hours
  difficulty: DifficultyLevel;
  tags: string[];
  category?: string;
  thumbnail?: string;
  
  // Visual progression
  milestones?: Array<{
    name: string;
    description?: string;
    courseIndex: number; // After which course this milestone is reached
    xpReward?: number;
  }>;
  
  // Statistics
  enrollmentCount: number;
  completionCount: number;
  
  // Status
  isActive: boolean;
  isPublic: boolean;
  
  // AI-powered path settings
  aiSettings?: {
    targetSkill?: string;
    learningStyle?: string;
    timeCommitment?: string;
    [key: string]: any;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const learningPathSchema = new Schema<ILearningPath>(
  {
    name: {
      type: String,
      required: [true, 'Learning path name is required'],
      trim: true,
    },
    description: String,
    type: {
      type: String,
      enum: ['curated', 'ai-powered'],
      default: 'curated',
    },
    courses: [{
      course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
      },
      order: {
        type: Number,
        required: true,
      },
      isRequired: {
        type: Boolean,
        default: true,
      },
    }],
    prerequisites: [{
      type: Schema.Types.ObjectId,
      ref: 'LearningPath',
    }],
    requiredCourses: [{
      type: Schema.Types.ObjectId,
      ref: 'Course',
    }],
    estimatedDuration: {
      type: Number,
      min: 0,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    },
    tags: [String],
    category: String,
    thumbnail: String,
    milestones: [{
      name: String,
      description: String,
      courseIndex: Number,
      xpReward: Number,
    }],
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    completionCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    aiSettings: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

learningPathSchema.index({ type: 1, isActive: 1 });
learningPathSchema.index({ tags: 1 });
learningPathSchema.index({ name: 'text', description: 'text' });

export default mongoose.model<ILearningPath>('LearningPath', learningPathSchema);

