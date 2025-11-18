import mongoose, { Document, Schema } from 'mongoose';

export type VideoTutorialCategory = 'getting-started' | 'features' | 'courses' | 'account' | 'advanced' | 'other';

export interface IVideoTutorial extends Document {
  // Video details
  title: string;
  description?: string;
  videoUrl: string; // YouTube URL or Cloudinary URL
  videoId?: string; // YouTube video ID if applicable
  thumbnail?: string;
  duration?: number; // Duration in seconds
  
  // Organization
  category: VideoTutorialCategory;
  tags?: string[];
  order: number; // Display order within category
  
  // Related content
  relatedArticles?: mongoose.Types.ObjectId[];
  relatedFAQs?: mongoose.Types.ObjectId[];
  
  // Statistics
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  
  // Status
  isPublished: boolean;
  isFeatured: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const videoTutorialSchema = new Schema<IVideoTutorial>(
  {
    title: {
      type: String,
      required: [true, 'Tutorial title is required'],
      trim: true,
    },
    description: String,
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
    },
    videoId: String,
    thumbnail: String,
    duration: Number,
    category: {
      type: String,
      enum: ['getting-started', 'features', 'courses', 'account', 'advanced', 'other'],
      required: true,
      index: true,
    },
    tags: [String],
    order: {
      type: Number,
      default: 0,
    },
    relatedArticles: [{
      type: Schema.Types.ObjectId,
      ref: 'HelpArticle',
    }],
    relatedFAQs: [{
      type: Schema.Types.ObjectId,
      ref: 'FAQ',
    }],
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

videoTutorialSchema.index({ category: 1, order: 1 });
videoTutorialSchema.index({ isPublished: 1, isFeatured: 1 });
videoTutorialSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IVideoTutorial>('VideoTutorial', videoTutorialSchema);

