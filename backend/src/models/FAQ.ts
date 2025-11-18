import mongoose, { Document, Schema } from 'mongoose';

export type FAQCategory = 'general' | 'account' | 'courses' | 'payments' | 'technical' | 'features' | 'other';

export interface IFAQ extends Document {
  // FAQ details
  question: string;
  answer: string;
  category: FAQCategory;
  
  // Organization
  tags?: string[];
  order: number; // Display order within category
  
  // Statistics
  viewCount: number;
  helpfulCount: number; // Number of users who found it helpful
  notHelpfulCount: number; // Number of users who found it not helpful
  
  // Status
  isPublished: boolean;
  isFeatured: boolean; // Whether to show in featured section
  
  // Metadata
  lastUpdatedBy?: mongoose.Types.ObjectId; // Admin who last updated
  relatedArticles?: mongoose.Types.ObjectId[]; // Related help articles
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: [true, 'FAQ question is required'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'FAQ answer is required'],
    },
    category: {
      type: String,
      enum: ['general', 'account', 'courses', 'payments', 'technical', 'features', 'other'],
      required: true,
      index: true,
    },
    tags: [String],
    order: {
      type: Number,
      default: 0,
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
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedArticles: [{
      type: Schema.Types.ObjectId,
      ref: 'HelpArticle',
    }],
  },
  {
    timestamps: true,
  }
);

faqSchema.index({ category: 1, order: 1 });
faqSchema.index({ isPublished: 1, isFeatured: 1 });
faqSchema.index({ question: 'text', answer: 'text' });

export default mongoose.model<IFAQ>('FAQ', faqSchema);

