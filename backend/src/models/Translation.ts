import mongoose, { Document, Schema } from 'mongoose';

export type TranslationStatus = 'pending' | 'in_progress' | 'completed' | 'reviewed' | 'published';
export type ContentType = 'course' | 'lesson' | 'module' | 'assignment' | 'quiz' | 'faq' | 'help_article' | 'announcement' | 'achievement' | 'badge' | 'notification' | 'email';

export interface ITranslation extends Document {
  // Source content reference
  contentType: ContentType;
  contentId: mongoose.Types.ObjectId; // ID of the original content
  
  // Translation details
  language: string; // Target language code (e.g., 'es', 'fr', 'de')
  sourceLanguage: string; // Source language code (default: 'en')
  
  // Translated fields (varies by content type)
  translatedFields: {
    [key: string]: any; // Flexible structure for different content types
  };
  
  // Status and workflow
  status: TranslationStatus;
  isPublished: boolean;
  
  // Translation metadata
  translatedBy?: mongoose.Types.ObjectId; // User/translator who created/approved
  reviewedBy?: mongoose.Types.ObjectId; // User who reviewed
  reviewedAt?: Date;
  translationMethod: 'manual' | 'ai' | 'hybrid'; // How translation was created
  
  // AI translation metadata
  aiModel?: string; // AI model used (e.g., 'gpt-4', 'gpt-3.5-turbo')
  aiConfidence?: number; // Confidence score (0-1)
  requiresReview: boolean; // Whether human review is needed
  
  // Quality metrics
  qualityScore?: number; // Quality score (0-100)
  reviewNotes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const translationSchema = new Schema<ITranslation>(
  {
    contentType: {
      type: String,
      enum: ['course', 'lesson', 'module', 'assignment', 'quiz', 'faq', 'help_article', 'announcement', 'achievement', 'badge', 'notification', 'email'],
      required: true,
      index: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      index: true,
    },
    sourceLanguage: {
      type: String,
      default: 'en',
    },
    translatedFields: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'reviewed', 'published'],
      default: 'pending',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    translatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    translationMethod: {
      type: String,
      enum: ['manual', 'ai', 'hybrid'],
      default: 'ai',
    },
    aiModel: String,
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    requiresReview: {
      type: Boolean,
      default: true,
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    reviewNotes: String,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
translationSchema.index({ contentType: 1, contentId: 1, language: 1 }, { unique: true });
translationSchema.index({ language: 1, status: 1, isPublished: 1 });
translationSchema.index({ contentType: 1, language: 1, isPublished: 1 });

export default mongoose.model<ITranslation>('Translation', translationSchema);

