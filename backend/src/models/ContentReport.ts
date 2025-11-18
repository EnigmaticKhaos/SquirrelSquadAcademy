import mongoose, { Document, Schema } from 'mongoose';

export type ReportType = 'post' | 'comment' | 'message' | 'user' | 'course' | 'forum_post' | 'project';
export type ReportReason = 
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'inappropriate_content'
  | 'violence'
  | 'self_harm'
  | 'copyright'
  | 'impersonation'
  | 'other';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed' | 'escalated';

export interface IContentReport extends Document {
  // Reporter
  reporter: mongoose.Types.ObjectId;
  
  // Content being reported
  contentType: ReportType;
  contentId: mongoose.Types.ObjectId;
  
  // Report details
  reason: ReportReason;
  description?: string;
  evidence?: string[]; // URLs or references to evidence
  
  // Status
  status: ReportStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Moderation
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  moderationNotes?: string;
  actionTaken?: {
    type: 'warning' | 'content_removed' | 'user_warned' | 'user_suspended' | 'user_banned' | 'no_action';
    details?: string;
    warningId?: mongoose.Types.ObjectId;
  };
  
  // AI moderation result (if auto-flagged)
  aiModerationResult?: {
    isFlagged: boolean;
    severity: 'low' | 'medium' | 'high';
    categories: any;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const contentReportSchema = new Schema<IContentReport>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ['post', 'comment', 'message', 'user', 'course', 'forum_post', 'project'],
      required: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: [
        'spam',
        'harassment',
        'hate_speech',
        'inappropriate_content',
        'violence',
        'self_harm',
        'copyright',
        'impersonation',
        'other',
      ],
      required: true,
    },
    description: String,
    evidence: [String],
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'dismissed', 'escalated'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    moderationNotes: String,
    actionTaken: {
      type: {
        type: String,
        enum: ['warning', 'content_removed', 'user_warned', 'user_suspended', 'user_banned', 'no_action'],
      },
      details: String,
      warningId: {
        type: Schema.Types.ObjectId,
        ref: 'UserWarning',
      },
    },
    aiModerationResult: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
contentReportSchema.index({ contentType: 1, contentId: 1 });
contentReportSchema.index({ status: 1, priority: -1, createdAt: -1 });
contentReportSchema.index({ reporter: 1, createdAt: -1 });

export default mongoose.model<IContentReport>('ContentReport', contentReportSchema);

