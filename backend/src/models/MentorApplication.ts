import mongoose, { Document, Schema } from 'mongoose';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ReviewPriority = 'auto_approve' | 'review' | 'auto_reject';

export interface IMentorApplication extends Document {
  user: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  priority: ReviewPriority;
  
  // Application details
  motivation: string; // Why they want to be a mentor
  specialties: string[]; // Areas of expertise
  experience: string; // Relevant experience
  availability: {
    hoursPerWeek?: number;
    timezone?: string;
    preferredTimes?: string[];
  };
  maxMentees?: number;
  
  // Auto-evaluation metrics (calculated on submission)
  autoEvaluation: {
    level: number;
    coursesCompleted: number;
    averageRating: number;
    warningCount: number;
    accountAge: number; // days
    meetsAutoApproveCriteria: boolean;
    meetsAutoRejectCriteria: boolean;
    aiRecommendation?: 'approve' | 'review' | 'reject';
    aiReason?: string;
  };
  
  // Review
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const mentorApplicationSchema = new Schema<IMentorApplication>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['auto_approve', 'review', 'auto_reject'],
      default: 'review',
      index: true,
    },
    motivation: {
      type: String,
      required: true,
    },
    specialties: [{
      type: String,
    }],
    experience: String,
    availability: {
      hoursPerWeek: Number,
      timezone: String,
      preferredTimes: [String],
    },
    maxMentees: {
      type: Number,
      default: 5,
      min: 1,
      max: 20,
    },
    autoEvaluation: {
      level: {
        type: Number,
        default: 1,
      },
      coursesCompleted: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
      },
      warningCount: {
        type: Number,
        default: 0,
      },
      accountAge: {
        type: Number,
        default: 0,
      },
      meetsAutoApproveCriteria: {
        type: Boolean,
        default: false,
      },
      meetsAutoRejectCriteria: {
        type: Boolean,
        default: false,
      },
      aiRecommendation: {
        type: String,
        enum: ['approve', 'review', 'reject'],
      },
      aiReason: String,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    reviewNotes: String,
    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
mentorApplicationSchema.index({ status: 1, priority: 1, createdAt: -1 });
mentorApplicationSchema.index({ priority: 1, status: 1 });

export default mongoose.model<IMentorApplication>('MentorApplication', mentorApplicationSchema);

