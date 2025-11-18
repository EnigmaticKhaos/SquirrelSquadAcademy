import mongoose, { Document, Schema } from 'mongoose';

export type ResourceType = 'article' | 'video' | 'document' | 'book' | 'course' | 'tool' | 'website' | 'other';
export type ResourceCategory = 'programming' | 'design' | 'business' | 'marketing' | 'data-science' | 'devops' | 'mobile' | 'web' | 'general' | 'other';

export interface IResource extends Document {
  user?: mongoose.Types.ObjectId; // Optional - can be user-specific or platform-wide
  createdBy?: mongoose.Types.ObjectId; // Admin who created platform-wide resource
  
  // Resource details
  title: string;
  description?: string;
  resourceType: ResourceType;
  category: ResourceCategory;
  url: string;
  thumbnail?: string;
  
  // Metadata
  author?: string;
  publisher?: string;
  publishedDate?: Date;
  language?: string;
  tags?: string[];
  
  // Content details
  duration?: number; // For videos/courses, in minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isFree: boolean;
  cost?: number;
  currency?: string;
  
  // Related content
  course?: mongoose.Types.ObjectId; // Related course
  lesson?: mongoose.Types.ObjectId; // Related lesson
  
  // Organization
  isPublic: boolean; // Whether resource is visible to all users
  isFeatured: boolean; // Whether resource is featured
  isVerified: boolean; // Whether resource is verified by admin
  
  // Statistics
  viewCount: number;
  saveCount: number; // Number of users who saved this
  rating?: number; // Average rating
  ratingCount: number;
  
  // Status
  isArchived: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const resourceSchema = new Schema<IResource>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
    },
    description: String,
    resourceType: {
      type: String,
      enum: ['article', 'video', 'document', 'book', 'course', 'tool', 'website', 'other'],
      required: true,
    },
    category: {
      type: String,
      enum: ['programming', 'design', 'business', 'marketing', 'data-science', 'devops', 'mobile', 'web', 'general', 'other'],
      default: 'general',
    },
    url: {
      type: String,
      required: [true, 'Resource URL is required'],
    },
    thumbnail: String,
    author: String,
    publisher: String,
    publishedDate: Date,
    language: {
      type: String,
      default: 'en',
    },
    tags: [String],
    duration: Number,
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    },
    isFree: {
      type: Boolean,
      default: true,
    },
    cost: Number,
    currency: String,
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    saveCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

resourceSchema.index({ user: 1, isArchived: 1 });
resourceSchema.index({ isPublic: 1, isFeatured: 1 });
resourceSchema.index({ resourceType: 1, category: 1 });
resourceSchema.index({ tags: 1 });

export default mongoose.model<IResource>('Resource', resourceSchema);

