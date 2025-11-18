import mongoose, { Document, Schema } from 'mongoose';

export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketCategory = 'account' | 'billing' | 'technical' | 'course' | 'feature_request' | 'bug_report' | 'other';

export interface ISupportTicket extends Document {
  user: mongoose.Types.ObjectId; // User who created the ticket
  assignedTo?: mongoose.Types.ObjectId; // Admin/support agent assigned
  
  // Ticket details
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  
  // Attachments
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  
  // Related content
  relatedCourse?: mongoose.Types.ObjectId;
  relatedLesson?: mongoose.Types.ObjectId;
  
  // Communication
  messages: Array<{
    sender: mongoose.Types.ObjectId;
    content: string;
    attachments?: Array<{
      name: string;
      url: string;
      type: string;
    }>;
    isInternal: boolean; // Whether message is internal (admin-only)
    createdAt: Date;
  }>;
  
  // Resolution
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolution?: string;
  
  // Feedback
  userRating?: number; // 1-5 rating after resolution
  userFeedback?: string;
  
  // Statistics
  firstResponseTime?: number; // Time to first response in minutes
  resolutionTime?: number; // Time to resolution in minutes
  messageCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Ticket subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
    },
    category: {
      type: String,
      enum: ['account', 'billing', 'technical', 'course', 'feature_request', 'bug_report', 'other'],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    attachments: [{
      name: String,
      url: String,
      type: String,
      size: Number,
    }],
    relatedCourse: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    relatedLesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    messages: [{
      sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      attachments: [{
        name: String,
        url: String,
        type: String,
      }],
      isInternal: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    resolvedAt: Date,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: String,
    userRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    userFeedback: String,
    firstResponseTime: Number,
    resolutionTime: Number,
    messageCount: {
      type: Number,
      default: 1, // Initial message
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: -1, createdAt: -1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ category: 1, status: 1 });

export default mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);

