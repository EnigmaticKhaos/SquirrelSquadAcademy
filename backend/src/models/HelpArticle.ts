import mongoose, { Document, Schema } from 'mongoose';

export type HelpArticleCategory = 'getting-started' | 'account-settings' | 'courses' | 'payments' | 'features' | 'troubleshooting' | 'api' | 'other';
export type HelpArticleStatus = 'draft' | 'published' | 'archived';

export interface IHelpArticle extends Document {
  // Article details
  title: string;
  slug: string; // URL-friendly identifier
  content: string; // Rich text content
  excerpt?: string; // Short summary
  category: HelpArticleCategory;
  status: HelpArticleStatus;
  
  // Media
  thumbnail?: string; // Thumbnail image URL
  videoUrl?: string; // Optional video tutorial URL
  
  // Organization
  tags?: string[];
  order: number; // Display order within category
  
  // Author
  author: mongoose.Types.ObjectId; // Admin who created/updated
  lastUpdatedBy?: mongoose.Types.ObjectId;
  
  // Statistics
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  
  // Related content
  relatedArticles?: mongoose.Types.ObjectId[];
  relatedFAQs?: mongoose.Types.ObjectId[];
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Timestamps
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const helpArticleSchema = new Schema<IHelpArticle>(
  {
    title: {
      type: String,
      required: [true, 'Article title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Article slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: [true, 'Article content is required'],
    },
    excerpt: String,
    category: {
      type: String,
      enum: ['getting-started', 'account-settings', 'courses', 'payments', 'features', 'troubleshooting', 'api', 'other'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    thumbnail: String,
    videoUrl: String,
    tags: [String],
    order: {
      type: Number,
      default: 0,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
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
    relatedArticles: [{
      type: Schema.Types.ObjectId,
      ref: 'HelpArticle',
    }],
    relatedFAQs: [{
      type: Schema.Types.ObjectId,
      ref: 'FAQ',
    }],
    metaTitle: String,
    metaDescription: String,
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

helpArticleSchema.index({ slug: 1 }, { unique: true });
helpArticleSchema.index({ category: 1, status: 1, order: 1 });
helpArticleSchema.index({ status: 1, publishedAt: -1 });
helpArticleSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

export default mongoose.model<IHelpArticle>('HelpArticle', helpArticleSchema);

