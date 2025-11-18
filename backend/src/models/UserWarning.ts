import mongoose, { Document, Schema } from 'mongoose';

export type WarningType = 'content_violation' | 'harassment' | 'spam' | 'inappropriate_behavior' | 'other';
export type WarningSeverity = 'low' | 'medium' | 'high';

export interface IUserWarning extends Document {
  user: mongoose.Types.ObjectId;
  type: WarningType;
  severity: WarningSeverity;
  
  // Warning details
  reason: string;
  description: string;
  relatedReport?: mongoose.Types.ObjectId;
  relatedContent?: {
    type: string;
    id: mongoose.Types.ObjectId;
  };
  
  // Issued by
  issuedBy: mongoose.Types.ObjectId;
  
  // Status
  acknowledged: boolean;
  acknowledgedAt?: Date;
  
  // Expiration
  expiresAt?: Date;
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const userWarningSchema = new Schema<IUserWarning>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['content_violation', 'harassment', 'spam', 'inappropriate_behavior', 'other'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    relatedReport: {
      type: Schema.Types.ObjectId,
      ref: 'ContentReport',
    },
    relatedContent: {
      type: {
        type: String,
      },
      id: {
        type: Schema.Types.ObjectId,
      },
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: Date,
    expiresAt: Date,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userWarningSchema.index({ user: 1, isActive: 1, createdAt: -1 });
userWarningSchema.index({ expiresAt: 1, isActive: 1 });

export default mongoose.model<IUserWarning>('UserWarning', userWarningSchema);

