import mongoose, { Document, Schema } from 'mongoose';

export type MentorshipStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type MentorshipRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface IMentorshipRequest extends Document {
  mentee: mongoose.Types.ObjectId;
  mentor: mongoose.Types.ObjectId;
  status: MentorshipRequestStatus;
  
  // Request details
  message?: string;
  goals?: string[];
  preferredCommunicationMethod?: 'message' | 'video' | 'both';
  expectedDuration?: number; // in weeks
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
}

export interface IMentorship extends Document {
  mentee: mongoose.Types.ObjectId;
  mentor: mongoose.Types.ObjectId;
  status: MentorshipStatus;
  
  // Mentorship details
  goals: string[];
  startDate: Date;
  endDate?: Date;
  expectedDuration?: number; // in weeks
  
  // Communication
  preferredCommunicationMethod: 'message' | 'video' | 'both';
  meetingFrequency?: 'weekly' | 'biweekly' | 'monthly';
  
  // Progress tracking
  sessions: Array<{
    _id?: mongoose.Types.ObjectId;
    date: Date;
    duration?: number; // in minutes
    notes?: string;
    goalsDiscussed?: string[];
    nextSteps?: string[];
    rating?: number; // 1-5
    feedback?: string;
  }>;
  
  // Milestones
  milestones: Array<{
    _id?: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    targetDate?: Date;
    completed: boolean;
    completedAt?: Date;
    notes?: string;
  }>;
  
  // Ratings and feedback
  menteeRating?: number; // 1-5
  menteeFeedback?: string;
  mentorRating?: number; // 1-5
  mentorFeedback?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const mentorshipRequestSchema = new Schema<IMentorshipRequest>(
  {
    mentee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    message: String,
    goals: [String],
    preferredCommunicationMethod: {
      type: String,
      enum: ['message', 'video', 'both'],
      default: 'message',
    },
    expectedDuration: Number,
    respondedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
mentorshipRequestSchema.index({ mentee: 1, mentor: 1 });
mentorshipRequestSchema.index({ status: 1, createdAt: -1 });

const mentorshipSchema = new Schema<IMentorship>(
  {
    mentee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    goals: [{
      type: String,
      required: true,
    }],
    startDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    endDate: Date,
    expectedDuration: Number,
    preferredCommunicationMethod: {
      type: String,
      enum: ['message', 'video', 'both'],
      default: 'message',
    },
    meetingFrequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
    },
    sessions: [{
      date: {
        type: Date,
        required: true,
      },
      duration: Number,
      notes: String,
      goalsDiscussed: [String],
      nextSteps: [String],
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedback: String,
    }],
    milestones: [{
      title: {
        type: String,
        required: true,
      },
      description: String,
      targetDate: Date,
      completed: {
        type: Boolean,
        default: false,
      },
      completedAt: Date,
      notes: String,
    }],
    menteeRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    menteeFeedback: String,
    mentorRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    mentorFeedback: String,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
mentorshipSchema.index({ mentee: 1, status: 1 });
mentorshipSchema.index({ mentor: 1, status: 1 });
mentorshipSchema.index({ status: 1, createdAt: -1 });

export const MentorshipRequest = mongoose.model<IMentorshipRequest>('MentorshipRequest', mentorshipRequestSchema);
export default mongoose.model<IMentorship>('Mentorship', mentorshipSchema);

