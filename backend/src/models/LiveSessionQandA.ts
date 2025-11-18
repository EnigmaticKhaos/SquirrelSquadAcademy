import mongoose, { Document, Schema } from 'mongoose';

export type QuestionStatus = 'pending' | 'answered' | 'dismissed';
export type QuestionPriority = 'low' | 'normal' | 'high';

export interface ILiveSessionQandA extends Document {
  session: mongoose.Types.ObjectId;
  askedBy: mongoose.Types.ObjectId; // User who asked the question
  answeredBy?: mongoose.Types.ObjectId; // Host/co-host who answered
  
  // Question details
  question: string;
  status: QuestionStatus;
  priority: QuestionPriority;
  
  // Answer
  answer?: string;
  answeredAt?: Date;
  
  // Upvoting (for prioritizing questions)
  upvotes: mongoose.Types.ObjectId[]; // Users who upvoted
  upvoteCount: number;
  
  // Visibility
  isPinned: boolean; // Whether question is pinned by host
  isVisible: boolean; // Whether question is visible to all
  
  // Timestamps
  askedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const liveSessionQandASchema = new Schema<ILiveSessionQandA>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'LiveSession',
      required: true,
      index: true,
    },
    askedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    answeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'answered', 'dismissed'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    answer: String,
    answeredAt: Date,
    upvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

liveSessionQandASchema.index({ session: 1, status: 1, upvoteCount: -1 });
liveSessionQandASchema.index({ session: 1, isPinned: -1, askedAt: -1 });

export default mongoose.model<ILiveSessionQandA>('LiveSessionQandA', liveSessionQandASchema);

