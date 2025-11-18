import mongoose, { Document, Schema } from 'mongoose';

export type CourseType = 'coding' | 'non-coding';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ICourse extends Document {
  title: string;
  description: string;
  courseType: CourseType;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // in hours
  tags: string[];
  category: string;
  
  // Media
  thumbnail?: string;
  previewVideo?: string;
  
  // Pricing
  isFree: boolean;
  price?: number;
  currency?: string;
  
  // Metadata
  enrollmentCount: number;
  completionCount: number;
  passCount: number;
  averageRating?: number;
  reviewCount: number;
  
  // Structure
  modules: mongoose.Types.ObjectId[];
  prerequisites: mongoose.Types.ObjectId[];
  
  // Versioning
  version: number;
  versionHistory: Array<{
    version: number;
    changes: string;
    updatedAt: Date;
  }>;
  
  // Status
  status: 'draft' | 'coming_soon' | 'published' | 'archived';
  publishedAt?: Date;
  
  // Test mode
  testModeEnabled: boolean;
  
  // Preview
  previewModule?: mongoose.Types.ObjectId;
  
  // Waitlist
  hasWaitlist: boolean;
  maxEnrollments?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
    },
    courseType: {
      type: String,
      enum: ['coding', 'non-coding'],
      required: [true, 'Course type is required'],
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: [true, 'Difficulty level is required'],
    },
    estimatedDuration: {
      type: Number,
      required: [true, 'Estimated duration is required'],
      min: 0,
    },
    tags: [String],
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    thumbnail: String,
    previewVideo: String,
    isFree: {
      type: Boolean,
      default: false,
    },
    price: Number,
    currency: {
      type: String,
      default: 'USD',
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    completionCount: {
      type: Number,
      default: 0,
    },
    passCount: {
      type: Number,
      default: 0,
    },
    averageRating: Number,
    reviewCount: {
      type: Number,
      default: 0,
    },
    modules: [{
      type: Schema.Types.ObjectId,
      ref: 'Module',
    }],
    prerequisites: [{
      type: Schema.Types.ObjectId,
      ref: 'Course',
    }],
    version: {
      type: Number,
      default: 1,
    },
    versionHistory: [{
      version: Number,
      changes: String,
      updatedAt: Date,
    }],
    status: {
      type: String,
      enum: ['draft', 'coming_soon', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: Date,
    testModeEnabled: {
      type: Boolean,
      default: false,
    },
    previewModule: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
    },
    hasWaitlist: {
      type: Boolean,
      default: false,
    },
    maxEnrollments: Number,
  },
  {
    timestamps: true,
  }
);

// Indexes
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ courseType: 1, difficulty: 1, category: 1 });
courseSchema.index({ status: 1, publishedAt: -1 });

export default mongoose.model<ICourse>('Course', courseSchema);

