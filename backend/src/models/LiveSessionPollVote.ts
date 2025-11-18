import mongoose, { Document, Schema } from 'mongoose';

export interface ILiveSessionPollVote extends Document {
  poll: mongoose.Types.ObjectId;
  session: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  
  // Vote details
  selectedOptions: number[]; // Indices of selected options
  votedAt: Date;
  
  // Timestamps
  createdAt: Date;
}

const liveSessionPollVoteSchema = new Schema<ILiveSessionPollVote>(
  {
    poll: {
      type: Schema.Types.ObjectId,
      ref: 'LiveSessionPoll',
      required: true,
      index: true,
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: 'LiveSession',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    selectedOptions: [{
      type: Number,
      required: true,
      min: 0,
    }],
    votedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

liveSessionPollVoteSchema.index({ poll: 1, user: 1 }, { unique: true });
liveSessionPollVoteSchema.index({ session: 1, votedAt: -1 });

export default mongoose.model<ILiveSessionPollVote>('LiveSessionPollVote', liveSessionPollVoteSchema);

