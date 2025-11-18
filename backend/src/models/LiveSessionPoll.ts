import mongoose, { Document, Schema } from 'mongoose';

export interface ILiveSessionPoll extends Document {
  session: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId; // User who created the poll
  
  // Poll details
  question: string;
  options: string[]; // Poll options
  isMultipleChoice: boolean; // Whether multiple selections allowed
  isAnonymous: boolean; // Whether poll is anonymous
  
  // Timing
  startedAt: Date;
  endedAt?: Date;
  duration?: number; // Duration in seconds
  
  // Results
  totalVotes: number;
  results: Array<{
    option: string;
    votes: number;
    percentage: number;
  }>;
  
  // Status
  isActive: boolean;
  isEnded: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const liveSessionPollSchema = new Schema<ILiveSessionPoll>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'LiveSession',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    question: {
      type: String,
      required: [true, 'Poll question is required'],
      trim: true,
    },
    options: [{
      type: String,
      required: true,
      trim: true,
    }],
    isMultipleChoice: {
      type: Boolean,
      default: false,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
    duration: Number,
    totalVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    results: [{
      option: String,
      votes: {
        type: Number,
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0,
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isEnded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

liveSessionPollSchema.index({ session: 1, isActive: 1 });
liveSessionPollSchema.index({ session: 1, startedAt: -1 });

export default mongoose.model<ILiveSessionPoll>('LiveSessionPoll', liveSessionPollSchema);

